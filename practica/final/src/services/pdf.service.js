import PDFDocument from 'pdfkit';

export const generateDeliveryNotePdf = (note, signatureBuffer = null) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const { user, company, client, project } = note;

        // Cabecera
        doc.fontSize(20).font('Helvetica-Bold').text('ALBARÁN', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(`Fecha: ${new Date(note.workDate).toLocaleDateString('es-ES')}`, { align: 'right' });
        doc.moveDown();

        // Datos de la empresa
        doc.fontSize(12).font('Helvetica-Bold').text('Empresa emisora');
        doc.fontSize(10).font('Helvetica');
        if (company) {
            doc.text(`${company.name || ''}`);
            doc.text(`CIF: ${company.cif || ''}`);
            if (company.address?.street) {
                doc.text(`${company.address.street} ${company.address.number || ''}, ${company.address.city || ''}`);
            }
        }
        if (user) doc.text(`Responsable: ${user.name || ''} ${user.lastName || ''}`.trim());
        doc.moveDown();

        // Datos del cliente
        doc.fontSize(12).font('Helvetica-Bold').text('Cliente');
        doc.fontSize(10).font('Helvetica');
        if (client) {
            doc.text(`${client.name || ''}`);
            doc.text(`CIF: ${client.cif || ''}`);
            if (client.email) doc.text(`Email: ${client.email}`);
            if (client.address?.street) {
                doc.text(`${client.address.street} ${client.address.number || ''}, ${client.address.city || ''}`);
            }
        }
        doc.moveDown();

        // Datos del proyecto
        doc.fontSize(12).font('Helvetica-Bold').text('Proyecto');
        doc.fontSize(10).font('Helvetica');
        if (project) {
            doc.text(`${project.name || ''} (${project.projectCode || ''})`);
            if (project.address?.street) {
                doc.text(`${project.address.street} ${project.address.number || ''}, ${project.address.city || ''}`);
            }
        }
        doc.moveDown();

        // Descripción
        if (note.description) {
            doc.fontSize(12).font('Helvetica-Bold').text('Descripción');
            doc.fontSize(10).font('Helvetica').text(note.description);
            doc.moveDown();
        }

        // Detalle del trabajo
        doc.fontSize(12).font('Helvetica-Bold').text('Detalle');
        doc.moveDown(0.3);

        if (note.format === 'material') {
            doc.fontSize(10).font('Helvetica-Bold').text('Material | Cantidad | Unidad', { underline: true });
            doc.font('Helvetica').text(`${note.material || ''} | ${note.quantity ?? ''} | ${note.unit || ''}`);
        } else {
            if (note.workers && note.workers.length > 0) {
                doc.fontSize(10).font('Helvetica-Bold').text('Trabajador | Horas', { underline: true });
                note.workers.forEach(w => {
                    doc.font('Helvetica').text(`${w.name} | ${w.hours}h`);
                });
                const totalHours = note.workers.reduce((acc, w) => acc + w.hours, 0);
                doc.moveDown(0.3).font('Helvetica-Bold').text(`Total: ${totalHours}h`);
            } else {
                doc.fontSize(10).font('Helvetica-Bold').text('Horas trabajadas:');
                doc.font('Helvetica').text(`${note.hours ?? 0}h`);
            }
        }

        doc.moveDown(2);

        // Firma
        doc.fontSize(12).font('Helvetica-Bold').text('Firma');
        doc.moveDown(0.3);

        if (note.signed) {
            if (signatureBuffer) {
                doc.image(signatureBuffer, { width: 200 });
                doc.moveDown(0.5);
            }
            doc.fontSize(10).font('Helvetica').text(`Firmado el ${new Date(note.signedAt).toLocaleDateString('es-ES')}`);
        } else {
            doc.fontSize(10).font('Helvetica').text('Pendiente de firma');
        }

        doc.moveDown(3);
        doc.fontSize(8).font('Helvetica').fillColor('gray')
            .text('Generado por BildyApp', { align: 'center' });

        doc.end();
    });
};
