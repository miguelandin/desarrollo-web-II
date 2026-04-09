### Iniciar bd
```bash
npx prisma db push # pasar estructura de la bd
npx prisma db seed # poner valores por defecto a la bd
```

### Consultas para probar
Ver todos los libros:
```bash
curl -s -X GET http://localhost:3000/api/books | jq
```
Ver todos los libros filtrados por género:
```bash
curl -s -X GET "http://localhost:3000/api/books?genre=Aventura" | jq
```
Iniciar sesión y guardar jwt en TOKEN para los siguientes comandos:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@ejemplo.com","password":"123456"}' | jq -r '.token')
echo $TOKEN
```
Ver perfil:
```bash
curl -s -X GET http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN" | jq
```
Pedir préstamo del libro con id 1:
```bash
curl -s -X POST http://localhost:3000/api/loans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bookId": 1}' | jq
```
Devolver el libro con id 1:
```bash
curl -s -X PUT http://localhost:3000/api/loans/1/return \
  -H "Authorization: Bearer $TOKEN" | jq
```

Dejar una reseña al libro con id 1:
```bash
curl -s -X POST http://localhost:3000/api/books/1/reviews \
  -H "Authorization: Bearer $TOKEN" \            
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "¡Un libro increíble, la magia de la alomancia es fascinante!"}' | jq
```
