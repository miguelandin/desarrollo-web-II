export const notifySlackError = async (req, err) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const payload = {
        text: `🔴 *Error 5XX — BildyApp*`,
        attachments: [
            {
                color: 'danger',
                fields: [
                    { title: 'Timestamp', value: new Date().toISOString(), short: true },
                    { title: 'Método', value: req.method, short: true },
                    { title: 'Ruta', value: req.originalUrl, short: true },
                    { title: 'Status', value: String(err.statusCode || 500), short: true },
                    { title: 'Mensaje', value: err.message || 'Error desconocido' },
                    { title: 'Stack', value: err.stack ? err.stack.slice(0, 500) : 'N/A' }
                ]
            }
        ]
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch {
        // No interrumpir el flujo si Slack falla
    }
};
