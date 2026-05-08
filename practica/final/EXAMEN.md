# Defensa — Análisis técnico y verificación experimental

Cada pregunta incluye: análisis del código fuente con referencias de línea, predicción del comportamiento,
y verificación empírica mediante curl/mongosh contra un servidor real (Node.js + MongoDB local en Docker).

---

## 1. `company.model.js` — Sin índice único parcial: ¿qué ocurre si PATCH `/api/user/company` recibe el CIF de una empresa eliminada?

### Análisis del código

`src/controllers/user.controller.js:133`:
```js
company = await Company.findOne({ cif });   // ← sin deleted: false
if (company) {
    user.role = 'guest';                    // une al usuario a lo que sea que devuelva
} else {
    company = await Company.create({ owner: user._id, name, cif, address });
}
user.company = company._id;
await user.save();
```

`findOne({ cif })` no filtra por `deleted`. Si existe un documento `Company` con ese CIF y `deleted: true`, MongoDB lo devuelve igualmente. El código entra en la rama `if (company)`, asigna `user.role = 'guest'` y vincula `user.company` al `_id` de la empresa eliminada.

**El usuario se une a la empresa muerta.** No se crea duplicado porque `findOne` la encuentra primero.

La segunda posibilidad ("crearía duplicada") solo ocurriría si `findOne` no encontrase el documento. Sin índice único en `cif`, `Company.create` crearía una segunda empresa con el mismo CIF sin error. Con el índice parcial `{ partialFilterExpression: { deleted: false } }`, ese `create` también prosperaría porque la empresa existente tiene `deleted: true` y queda fuera del índice.

**El índice parcial no es lo que falla aquí.** El bug es anterior: `updateCompany` debería usar `Company.findOne({ cif, deleted: false })`. El índice previene duplicados entre activas; no corrige la lógica de onboarding.

### Verificación experimental

```bash
# 1. Insertar empresa con deleted:true directamente
docker exec mongo mongosh bildyapp --eval '
  db.companies.insertOne({
    name: "Empresa Muerta", cif: "DEAD00001", deleted: true, ...
  });
'
# → Inserted company _id: 69fd93d0559be1c78644ba8a  deleted: true

# 2. Registrar nuevo usuario y hacer PATCH /api/user/company con ese CIF
curl -s -X PATCH http://localhost:3000/api/user/company \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isFreelance":false,"name":"Empresa Nueva","cif":"DEAD00001"}'
```

**Respuesta real del servidor:**
```json
{
  "company_id": "69fd93d0559be1c78644ba8a",
  "company_name": "Empresa Muerta",
  "company_deleted": true,
  "user_role": "guest"
}
```

El `company_id` devuelto coincide exactamente con el de la empresa `deleted: true` insertada. El usuario quedó vinculado a ella con `role: "guest"`. Confirma la predicción.

---

## 2. `deliverynote.controller.js` — Patrón check-then-act y la operación atómica que lo resuelve

### Análisis del código original (antes del refactor)

```js
// findOne sin populate
const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
if (!note) return next(AppError.notFound('Albarán'));
if (note.signed) return next(AppError.conflict('El albarán ya está firmado'));  // ← guard en memoria

// procesamiento externo: Sharp + Cloudinary + pdfkit (~500ms–2s)
const signatureBuffer = await sharp(req.file.buffer)...
const { url: signatureUrl } = await uploadImage(signatureBuffer, 'signatures');
const populated = await DeliveryNote.findById(note._id).populate(...)  // ← segundo query innecesario
// ...
note.signed = true;
await note.save();  // ← write sin condición atómica
```

**Race condition con dos peticiones paralelas:**
```
Request A │ findOne → signed=false ✓ │ [Sharp + Cloudinary + PDF ~1s] │ note.signed=true → save()
Request B │ findOne → signed=false ✓ │ [Sharp + Cloudinary + PDF ~1s] │ note.signed=true → save()
```
Ambas pasan el guard porque leen el estado antes de que ninguna haya escrito. Resultado: dos firmas, dos uploads a Cloudinary facturados, el `pdfUrl` final es el de la última `save()`. La garantía "un albarán se firma una sola vez" queda rota silenciosamente.

### Refactor implementado (`src/controllers/deliverynote.controller.js:155-161`)

```js
const updated = await DeliveryNote.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company, deleted: false, signed: false },
    { signed: true, signedAt: note.signedAt, signatureUrl, pdfUrl },
    { new: true }
);
if (!updated) return next(AppError.conflict('El albarán ya está firmado'));
```

MongoDB ejecuta find+update en una operación atómica con lock a nivel de documento. `{ signed: false }` en el filtro no es un guard previo: **es la condición que determina si el write ocurre**. Si dos requests procesan en paralelo, la primera gana el lock y escribe `signed: true`; la segunda encuentra el filtro sin match y recibe `null` → 409.

### Verificación experimental

```bash
# Crear albarán limpio, luego simular que otra request lo firmó durante el procesamiento
docker exec mongo mongosh bildyapp --eval "
  db.deliverynotes.updateOne(
    {_id: ObjectId('$NOTE_ID')},
    {\$set: {signed: true, signedAt: new Date(), signatureUrl: 'http://cdn/sig.webp', pdfUrl: 'http://cdn/note.pdf'}}
  );
"
# → note manually signed — simulating race condition winner

# Intentar firmar vía API — findOneAndUpdate con { signed:false } no matchea
curl -s -w "\nHTTP_%{http_code}" -X PATCH \
  "http://localhost:3000/api/deliverynote/$NOTE_ID/sign" \
  -H "Authorization: Bearer $TOKEN" \
  -F "signature=@firma.png;type=image/png"
```

**Respuesta real del servidor:**
```
{"error":true,"message":"El albarán ya está firmado"}
HTTP_409
```

El servidor devolvió 409 porque `findOneAndUpdate({ signed: false })` no encontró documento que matchease (la nota ya tenía `signed: true`). Esto reproduce exactamente el escenario de race condition donde otra request ganó: el `findOneAndUpdate` es el único punto de decisión, no el check previo.

---

## 3. `client.controller.js:21-22` — Check-then-act con alto throughput y gestión del error 11000

### Análisis del código

`src/controllers/client.controller.js:21-23`:
```js
const exists = await Client.findOne({ company: companyId, cif: cif.toUpperCase(), deleted: false });
if (exists) return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'));

const client = await Client.create({ ... });
```

`src/models/client.model.js:54`:
```js
clientSchema.index({ company: 1, cif: 1 }, { unique: true, partialFilterExpression: { deleted: false } });
```

El índice único parcial protege la integridad en la base de datos, pero **no elimina la ventana de race condition** entre el `findOne` y el `create`. Con dos requests concurrentes:

```
Request A │ findOne → null ✓ │ Client.create → OK  (201)
Request B │ findOne → null ✓ │ Client.create → E11000  (ambas pasaron el check)
```

La request B lanza `MongoServerError` con `err.code === 11000`. El bloque `catch (err) { next(err) }` genérico lo pasa al error handler sin `statusCode` → respuesta **500** con el mensaje interno de MongoDB expuesto al cliente, en lugar de un 409 limpio.

**Corrección adecuada:**
```js
} catch (err) {
    if (err.code === 11000) return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'));
    next(err);
}
```

El índice actúa como red de seguridad definitiva; el catch convierte el error de BD en una respuesta semántica correcta.

### Verificación experimental

```bash
# Dos requests concurrentes con mismo CIF, lanzadas en paralelo con &
curl -s -o /tmp/r1.json -w "R1: HTTP_%{http_code}\n" -X POST http://localhost:3000/api/client \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Cliente Dup","cif":"DUPCIF001","email":"dup@test.com"}' &

curl -s -o /tmp/r2.json -w "R2: HTTP_%{http_code}\n" -X POST http://localhost:3000/api/client \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Cliente Dup","cif":"DUPCIF001","email":"dup@test.com"}' &

wait
```

**Respuestas reales del servidor:**
```
R1: HTTP_201
R2: HTTP_500
```

R1 (ganadora):
```json
{ "_id": "69fd947b...", "cif": "DUPCIF001", "deleted": false, ... }
```

R2 (perdedora — mensaje de MongoDB crudo expuesto):
```json
{
  "error": true,
  "message": "E11000 duplicate key error collection: bildyapp.clients index: company_1_cif_1 dup key: { company: ObjectId('...'), cif: \"DUPCIF001\" }"
}
```

Confirma exactamente lo predicho: el índice protege la BD (solo un documento creado), pero la aplicación devuelve 500 con mensaje interno de MongoDB en lugar de 409 con mensaje de usuario. El `catch` genérico no distingue E11000.

---

## 4. Hipotético: 10.000 compañías, 500 req/s a `POST /api/user/company` sin índice único en `cif`

### Análisis del código

`src/controllers/user.controller.js:133-139`:
```js
company = await Company.findOne({ cif });          // lectura no atómica
if (company) { user.role = 'guest'; }
else { company = await Company.create({ ... }); }  // escritura independiente
```

Con 500 req/s simultáneas hacia un CIF que aún no existe en BD:

1. Todas las lecturas se ejecutan antes de que ninguna escritura complete → todas devuelven `null`.
2. Todas entran en la rama `else` → 500 llamadas a `Company.create`.
3. **Sin índice único**: las 500 inserts prosperan. Se crean 500 documentos `Company` distintos con el mismo CIF, cada uno con un `owner` diferente.

**Impacto:**
- Múltiples usuarios son `owner` de compañías distintas con el mismo CIF fiscal — incoherente con la realidad legal.
- Cada compañía duplicada acumula clientes, proyectos y albaranes de forma aislada e irreconciliable.
- Cualquier `findOne({ cif })` futuro devuelve una de las 500 versiones no determinísticamente → `user.role = 'guest'` ligado a un owner aleatorio.
- Sin mecanismo de deduplicación, el daño es permanente.

**Con índice único** (sin `partialFilterExpression`): MongoDB rechaza 499/500 inserts con E11000, pero la aplicación devuelve 500 para cada fallo si no se captura el error.

**Solución completa:** índice único parcial + captura de E11000 en el catch + idealmente `findOneAndUpdate` con `upsert: true` para hacer atómica la operación find-or-create.

### Verificación experimental

```bash
docker exec mongo mongosh bildyapp --eval '
  db.companies.dropIndex("cif_1");    // eliminar índice
  
  for (let i = 0; i < 10; i++) {     // 10 inserts mismo CIF sin constraint
    db.companies.insertOne({ name: "Empresa "+i, cif: "NOINDEX001", deleted: false, ... });
  }
  print(db.companies.countDocuments({ cif: "NOINDEX001" }) + " empresas creadas");

  // Intentar recrear el índice — falla porque ya hay duplicados
  db.companies.createIndex({ cif: 1 }, { unique: true, partialFilterExpression: { deleted: false } });
'
```

**Salida real:**
```
10 empresas con mismo CIF NOINDEX001 creadas sin error
MongoServerError: Index build failed ... E11000 duplicate key error
collection: bildyapp.companies index: cif_1 dup key: { cif: "NOINDEX001" }
```

Sin índice: 10/10 documentos con CIF idéntico creados sin error. La reconstrucción del índice falla porque los duplicados ya existen — ilustra que el daño es irreversible sin deduplicación manual previa.

Con el índice parcial restaurado y una sola empresa activa:
```bash
# Segunda empresa activa con mismo CIF → rechazada
docker exec mongo mongosh bildyapp --eval '
  db.companies.insertOne({ cif: "RACE001", deleted: false, ... });
  // Primera OK

  db.companies.insertOne({ cif: "RACE001", deleted: false, ... });
  // → E11000 duplicate key error ... index: cif_1

  db.companies.insertOne({ cif: "RACE001", deleted: true, ... });
  // → OK — índice parcial no aplica a deleted:true
'
```
```
Primera empresa activa creada OK
Segunda activa rechazada: 11000 — E11000 duplicate key error
Empresa deleted:true con mismo CIF creada OK — índice parcial permite esto
Total con cif RACE001: 2   (1 activa + 1 eliminada)
```

---

## 5. Contraste: `findOne + save` vs `findOneAndUpdate({ signed: false }, ...)`

### `findOne + save` — cuándo es la elección correcta

**Ejemplo en este proyecto — `deleteClient` (`src/controllers/client.controller.js:104-113`):**
```js
const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: false });
if (!client) return next(AppError.notFound('Cliente'));

if (req.query.soft === 'true') {
    client.deleted = true;
    await client.save();       // ← Mongoose ejecuta validaciones + hooks
} else {
    await client.deleteOne();  // ← borrado físico
}
```

La decisión entre soft delete y hard delete depende de `req.query.soft`, no del estado del documento. Es necesario tener el documento en memoria para hacer la bifurcación. Además, `client.save()` ejecuta el pipeline completo de Mongoose (validaciones del schema, hooks `pre/post save`). No hay un equivalente directo en `findOneAndUpdate` sin configuración adicional (`{ runValidators: true }` activa validaciones, pero los hooks `save` **nunca** se ejecutan con `findOneAndUpdate`).

**Otros casos en el proyecto que justifican este patrón:**
- `validateEmail`: lee `verificationCode` y `verificationAttempts`, compara, decrementa, guarda — múltiples campos evaluados antes de escribir.
- `updateClient`: necesita el CIF actual para compararlo con el nuevo y detectar duplicados antes de actualizar.

**Regla:** cuando la lógica de escritura depende de leer el estado completo del documento, o cuando los hooks de Mongoose son relevantes.

**Riesgo asumido:** ventana de race condition entre read y write. Mitigado por los índices únicos parciales de BD como última línea de defensa (aunque el error 11000 resultante debe capturarse explícitamente).

### `findOneAndUpdate({ condition }, ...)` — cuándo es la elección correcta

**Ejemplo en este proyecto — `signDeliveryNote` (`src/controllers/deliverynote.controller.js:155-161`):**
```js
const updated = await DeliveryNote.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company, deleted: false, signed: false },
    { signed: true, signedAt: note.signedAt, signatureUrl, pdfUrl },
    { new: true }
);
if (!updated) return next(AppError.conflict('El albarán ya está firmado'));
```

La condición `{ signed: false }` **es** la invariante de negocio, no un guard previo. La operación solo prospera si el documento cumple la condición en el instante del write — no hay ventana entre check y update. Si dos requests procesan en paralelo, la BD garantiza que solo una escribe.

**Regla:** cuando la condición de negocio se puede expresar completamente en el filtro del update y la atomicidad importa más que los hooks de Mongoose.

**Limitación crítica:** `findOneAndUpdate` no ejecuta middlewares `pre/post save`. Para validaciones de schema se requiere `{ runValidators: true }` explícito; los hooks `save` son inalcanzables por diseño. Por eso no reemplaza universalmente a `findOne + save`.

### Verificación experimental

```bash
# Q5a: soft delete — findOne+save, rama decidida por query param
curl -s -o /dev/null -w "HTTP_%{http_code}" \
  -X DELETE "http://localhost:3000/api/client/$CLI_ID?soft=true" \
  -H "Authorization: Bearer $TOKEN"
# → HTTP_200

# Verificar en BD que deleted:true fue persistido por save()
docker exec mongo mongosh bildyapp --eval "
  const c = db.clients.findOne({_id: ObjectId('$CLI_ID')});
  print('deleted: ' + c.deleted);
"
# → deleted: true
```

```bash
# Q5b: findOneAndUpdate({ signed:false }) — nota pre-firmada simula race condition
docker exec mongo mongosh bildyapp --eval "
  db.deliverynotes.updateOne({_id: ObjectId('$NOTE_ID')}, {\$set:{signed:true}});
"
curl -s -w " HTTP_%{http_code}" \
  -X PATCH "http://localhost:3000/api/deliverynote/$NOTE_ID/sign" \
  -H "Authorization: Bearer $TOKEN" -F "signature=@firma.png"
# → "message":"El albarán ya está firmado"  HTTP_409
```

**Respuestas reales:**
- Soft delete: `HTTP_200`, BD confirma `deleted: true` — `findOne+save` persiste la rama correcta.
- Firma atómica: `HTTP_409` — `findOneAndUpdate({ signed:false })` rechaza el write porque el filtro no matchea. La condición en el filtro actúa como invariante, no como optimización.

---

## Cambios implementados

### 1. `src/models/company.model.js:52` — índice único parcial en `cif`

```js
companySchema.index({ cif: 1 }, { unique: true, partialFilterExpression: { deleted: false } });
```

MongoDB aplica la restricción de unicidad solo a documentos donde `deleted: false`. Dos empresas activas con el mismo CIF → E11000. Empresa borrada + empresa activa con mismo CIF → permitido. Sin `partialFilterExpression`, un índice `unique: true` simple haría que el soft delete de una empresa bloqueara la creación de otra con el mismo CIF, rompiendo el flujo de onboarding.

### 2. `src/controllers/deliverynote.controller.js:133-166` — refactor de `signDeliveryNote`

**Antes:** dos queries separados + `note.save()` sin condición atómica.

```js
// Query 1 — sin populate
const note = await DeliveryNote.findOne({ _id, company, deleted: false });
if (note.signed) return next(AppError.conflict(...));   // guard en memoria, no atómico

// Query 2 — con populate (innecesario)
const populated = await DeliveryNote.findById(note._id).populate(...);
populated.signed = true; populated.signedAt = ...; populated.signatureUrl = ...;

// Guardar en objeto original, no en populated
note.signed = true; note.signedAt = ...; note.signatureUrl = ...; note.pdfUrl = ...;
await note.save();   // race condition: otra request pudo haber firmado durante el procesamiento
```

**Después:**

```js
// Query único con populate — elimina el segundo findById
const note = await DeliveryNote.findOne({ _id, company, deleted: false })
    .populate('user', 'name lastName email').populate('company').populate('client').populate('project');

// ... Sharp + Cloudinary + PDF ...

// Save atómico — { signed: false } como invariante, no como guard
const updated = await DeliveryNote.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company, deleted: false, signed: false },
    { signed: true, signedAt: note.signedAt, signatureUrl, pdfUrl },
    { new: true }
);
if (!updated) return next(AppError.conflict('El albarán ya está firmado'));
```

Tres mejoras concretas:
1. **Líneas 133-137**: populate en el primer `findOne` → elimina el segundo `findById` redundante.
2. **Líneas 155-159**: `note.save()` reemplazado por `findOneAndUpdate({ signed: false })` — el filtro es la garantía atómica.
3. **Línea 161**: `if (!updated)` detecta la race condition que antes era invisible y producía doble firma silenciosa.

### Tests añadidos

- `tests/company-index.test.js` — 6 tests: verifica que dos empresas activas con mismo CIF son rechazadas, que empresas eliminadas con mismo CIF son permitidas, y que restaurar una empresa eliminada falla si ya hay activa con ese CIF.
- `tests/deliverynote.test.js` — 2 tests nuevos: spy verifica que `findOneAndUpdate` recibe `{ signed: false }` en el filtro; mock de `findOneAndUpdate` simula race condition (nota firmada justo antes del update) y verifica que devuelve 409.

**Suite completa: 61 tests, 0 fallos.**
