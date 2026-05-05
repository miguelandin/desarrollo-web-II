import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BildyApp API',
            version: '1.0.0',
            description: 'API REST para gestión de albaranes digitales'
        },
        servers: [{ url: 'http://localhost:3000', description: 'Servidor local' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        lastName: { type: 'string' },
                        nif: { type: 'string' },
                        role: { type: 'string', enum: ['admin', 'guest'] },
                        status: { type: 'string', enum: ['pending', 'verified'] },
                        company: { $ref: '#/components/schemas/Company' }
                    }
                },
                Company: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        cif: { type: 'string' },
                        logo: { type: 'string' },
                        isFreelance: { type: 'boolean' },
                        address: { $ref: '#/components/schemas/Address' }
                    }
                },
                Client: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        cif: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        address: { $ref: '#/components/schemas/Address' },
                        deleted: { type: 'boolean' }
                    }
                },
                Project: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        projectCode: { type: 'string' },
                        client: { $ref: '#/components/schemas/Client' },
                        email: { type: 'string' },
                        notes: { type: 'string' },
                        active: { type: 'boolean' },
                        deleted: { type: 'boolean' },
                        address: { $ref: '#/components/schemas/Address' }
                    }
                },
                DeliveryNote: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        format: { type: 'string', enum: ['material', 'hours'] },
                        description: { type: 'string' },
                        workDate: { type: 'string', format: 'date-time' },
                        material: { type: 'string' },
                        quantity: { type: 'number' },
                        unit: { type: 'string' },
                        hours: { type: 'number' },
                        workers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    hours: { type: 'number' }
                                }
                            }
                        },
                        signed: { type: 'boolean' },
                        signedAt: { type: 'string', format: 'date-time' },
                        signatureUrl: { type: 'string' },
                        pdfUrl: { type: 'string' },
                        client: { $ref: '#/components/schemas/Client' },
                        project: { $ref: '#/components/schemas/Project' }
                    }
                },
                Address: {
                    type: 'object',
                    properties: {
                        street: { type: 'string' },
                        number: { type: 'string' },
                        postal: { type: 'string' },
                        city: { type: 'string' },
                        province: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'boolean', example: true },
                        message: { type: 'string' }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: {} },
                        totalItems: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        currentPage: { type: 'integer' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
