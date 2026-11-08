/**
 * Especificación OpenAPI 3.0 de la API del backend (SALON STYLO).
 * Se sirve en /api-docs (Swagger UI) y /api-docs.json (JSON crudo).
 */

const errorSchema = {
    type: "object",
    properties: {
        error: {
            type: "string",
            example: "Ruta no encontrada: GET /api/unknown"
        }
    }
};

const bearerAuth = [{ bearerAuth: [] }];

const clientSchema = {
    type: "object",
    properties: {
        idCli: { type: "integer", example: 1 },
        nameCli: { type: "string", example: "Ana" },
        surnameCli: { type: "string", example: "Gómez" },
        phoneCli: { type: "string", example: "1123456789" },
        dniCli: { type: "integer", example: 12345678 },
        emailCli: { type: "string", format: "email", example: "ana@mail.com" },
        addressCli: { type: "string", example: "Av. Siempre Viva 742" },
        idLocation: { type: "integer", example: 1 },
        location: {
            type: "object",
            properties: {
                idLocation: { type: "integer" },
                city: { type: "string" },
                zipCode: { type: "string" }
            }
        }
    }
};

const loungeSchema = {
    type: "object",
    properties: {
        idLounge: { type: "integer", example: 1 },
        name: { type: "string", example: "Salón Central" },
        loungeAddress: { type: "string", example: "Calle 123" },
        idLocation: { type: "integer", example: 1 }
    }
};

const loungeTypeSchema = {
    type: "object",
    properties: {
        idLoungeType: { type: "integer", example: 1 },
        nameLoungeType: { type: "string", example: "Salón Dorado" },
        minQuantity: { type: "integer", example: 50 },
        maxQuantity: { type: "integer", example: 200 },
        idLounge: { type: "integer", example: 1 },
        lounge: {
            type: "object",
            properties: { name: { type: "string" } }
        }
    }
};

const locationSchema = {
    type: "object",
    properties: {
        idLocation: { type: "integer", example: 1 },
        city: { type: "string", example: "Buenos Aires" },
        zipCode: { type: "string", example: "1000" }
    }
};

const priceSchema = {
    type: "object",
    properties: {
        effectiveDate: { type: "string", format: "date", example: "2026-01-01" },
        endDate: { type: "string", format: "date", nullable: true },
        value: { type: "number", example: 150000 },
        idLoungeType: { type: "integer", example: 1 },
        loungeType: {
            type: "object",
            properties: {
                minQuantity: { type: "integer" },
                maxQuantity: { type: "integer" }
            }
        }
    }
};

const reservationSchema = {
    type: "object",
    properties: {
        idReservation: { type: "integer", example: 1 },
        dateReservation: { type: "string", format: "date" },
        dateEvent: { type: "string", format: "date", example: "2026-12-15" },
        status: {
            type: "string",
            enum: ["pendiente", "aceptada", "confirmada", "cancelada"],
            example: "pendiente"
        },
        eventType: { type: "string", nullable: true, example: "Casamiento" },
        cantInvit: { type: "integer", example: 80 },
        maxCantInvit: { type: "integer", nullable: true, example: 200 },
        idCli: { type: "integer", example: 1 },
        idLounge: { type: "integer", example: 1 },
        idLoungeType: { type: "integer", example: 1 },
        idCardDetail: { type: "integer", nullable: true },
        client: { $ref: "#/components/schemas/Client" },
        lounge: { type: "object", properties: { name: { type: "string" } } },
        loungeType: { type: "object", properties: { nameLoungeType: { type: "string" } } },
        extraServices: {
            type: "array",
            items: { $ref: "#/components/schemas/ExtraService" }
        }
    }
};

const extraServiceSchema = {
    type: "object",
    properties: {
        idService: { type: "integer", example: 1 },
        nameService: { type: "string", example: "DJ" },
        detailService: { type: "string", example: "Servicio de DJ por 5 horas" },
        cost: { type: "number", example: 50000 }
    }
};

const cardDetailSchema = {
    type: "object",
    properties: {
        idCardDetail: { type: "integer", example: 1 },
        menuStage: { type: "string", example: "Menú Premium" },
        detail: { type: "string", example: "Entrada, principal y postre" },
        budget: { type: "number", example: 8000 },
        imageUrl: { type: "string", example: "/uploads/menu.jpg" },
        starter: { type: "string", nullable: true },
        mainCourse: { type: "string", nullable: true },
        dessert: { type: "string", nullable: true }
    }
};

const contractSchema = {
    type: "object",
    properties: {
        idContract: { type: "integer", example: 1 },
        dateContract: { type: "string", format: "date" },
        finalValue: { type: "number", example: 250000 },
        status: {
            type: "string",
            enum: [
                "generado",
                "en_revision",
                "aprobado",
                "rechazado",
                "firmado",
                "modificacion_en_curso"
            ],
            example: "generado"
        },
        idReservation: { type: "integer", example: 1 },
        eventStartTime: { type: "string", nullable: true, example: "21:00" },
        eventEndTime: { type: "string", nullable: true, example: "04:00" },
        cantExactaInvit: { type: "integer", nullable: true, example: 85 },
        modificationStatus: {
            type: "string",
            nullable: true,
            enum: ["pendiente", "aprobada", "rechazada"]
        },
        modificationComment: { type: "string", nullable: true },
        clausulas: { type: "object", nullable: true },
        reservation: { $ref: "#/components/schemas/Reservation" },
        extraServices: { type: "array", items: { $ref: "#/components/schemas/ExtraService" } },
        payments: { type: "array", items: { $ref: "#/components/schemas/Payment" } },
        calc: {
            type: "object",
            description: "Valores calculados (solo en GET /:id y POST /)",
            properties: {
                priceSalon: { type: "number" },
                menuValue: { type: "number" },
                totalExtras: { type: "number" },
                total: { type: "number" },
                hasPrice: { type: "boolean" },
                menuBudget: { type: "number" }
            }
        }
    }
};

const paymentSchema = {
    type: "object",
    properties: {
        idPayment: { type: "integer", example: 1 },
        value: { type: "number", example: 50000 },
        statusPayment: {
            type: "string",
            enum: ["pendiente", "seña", "pagado"],
            example: "pendiente"
        },
        datePayment: { type: "string", format: "date" },
        concept: { type: "string", nullable: true, example: "Seña" },
        dueDate: { type: "string", format: "date", nullable: true },
        notes: { type: "string", nullable: true },
        lastReminderAt: { type: "string", format: "date-time", nullable: true },
        idContract: { type: "integer", example: 1 },
        contract: { $ref: "#/components/schemas/Contract" }
    }
};

const notificationSchema = {
    type: "object",
    properties: {
        idNotificacion: { type: "integer", example: 1 },
        idUsuario: { type: "integer", example: 1 },
        mensaje: { type: "string", example: "Tu reserva fue aceptada." },
        tipo: { type: "string", example: "reserva_aceptada" },
        fecha: { type: "string", format: "date-time" },
        leida: { type: "boolean", example: false },
        idContract: { type: "integer", nullable: true },
        contract: {
            type: "object",
            nullable: true,
            properties: {
                idContract: { type: "integer" },
                status: { type: "string" }
            }
        }
    }
};

const perfilSchema = {
    type: "object",
    properties: {
        idUsuario: { type: "integer", example: 1 },
        username: { type: "string", example: "admin" },
        rol: { type: "string", enum: ["administrador", "cliente"], example: "administrador" },
        idCli: { type: "integer", nullable: true, example: null },
        passwordTemporal: { type: "boolean", example: false },
        client: { $ref: "#/components/schemas/Client" }
    }
};

const openapi = {
    openapi: "3.0.3",
    info: {
        title: "API SALON STYLO",
        version: "1.0.0",
        description:
            "API REST del sistema de reserva de salones de eventos SALON STYLO.\n\n" +
            "**Autenticación:** las rutas protegidas requieren el header " +
            "`Authorization: Bearer <token>`. El token se obtiene en `POST /api/auth/login`.\n\n" +
            "**Roles:** `administrador` y `cliente`. Las rutas con rol " +
            "`administrador` devuelven `403` si el token pertenece a un cliente.\n\n" +
            "**Errores:** todas las respuestas de error tienen la forma `{ \"error\": \"<mensaje>\" }`.",
        contact: { name: "SALON STYLO" }
    },
    servers: [
        { url: "http://localhost:3000", description: "Local" }
    ],
    tags: [
        { name: "auth", description: "Autenticación y registro" },
        { name: "client", description: "Clientes" },
        { name: "usuario", description: "Usuarios y administradores" },
        { name: "lounge", description: "Salones" },
        { name: "loungeType", description: "Tipos de salón" },
        { name: "location", description: "Ubicaciones" },
        { name: "price", description: "Precios" },
        { name: "reservation", description: "Reservas" },
        { name: "extraService", description: "Servicios extra" },
        { name: "cardDetail", description: "Tarjetas de menú" },
        { name: "contract", description: "Contratos" },
        { name: "notificacion", description: "Notificaciones" },
        { name: "payment", description: "Pagos" }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            Error: errorSchema,
            Client: clientSchema,
            Lounge: loungeSchema,
            LoungeType: loungeTypeSchema,
            Location: locationSchema,
            Price: priceSchema,
            Reservation: reservationSchema,
            ExtraService: extraServiceSchema,
            CardDetail: cardDetailSchema,
            Contract: contractSchema,
            Payment: paymentSchema,
            Notification: notificationSchema,
            Perfil: perfilSchema
        },
        responses: {
            Unauthorized: {
                description: "No autenticado o token inválido.",
                content: {
                    "application/json": {
                        schema: errorSchema,
                        example: { error: "No autenticado. Falta el token." }
                    }
                }
            },
            Forbidden: {
                description: "Autenticado pero sin permiso para el rol requerido.",
                content: {
                    "application/json": {
                        schema: errorSchema,
                        example: {
                            error:
                                "Acceso denegado. Esta acción solo está permitida para: administrador."
                        }
                    }
                }
            },
            NotFound: {
                description: "Recurso no encontrado.",
                content: {
                    "application/json": {
                        schema: errorSchema,
                        example: { error: "Recurso no encontrado." }
                    }
                }
            },
            ValidationError: {
                description: "Datos de entrada inválidos.",
                content: {
                    "application/json": {
                        schema: errorSchema,
                        example: { error: "Todos los campos son obligatorios." }
                    }
                }
            }
        }
    },
    paths: {
        "/api/auth/login": {
            post: {
                tags: ["auth"],
                summary: "Iniciar sesión",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: { type: "string", example: "admin" },
                                    password: { type: "string", example: "admin123" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Login exitoso.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        token: { type: "string" },
                                        idUsuario: { type: "integer" },
                                        rol: { type: "string", enum: ["administrador", "cliente"] },
                                        idCli: { type: "integer", nullable: true },
                                        passwordTemporal: { type: "boolean" },
                                        username: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: {
                        description: "Credenciales incorrectas.",
                        content: {
                            "application/json": {
                                schema: errorSchema,
                                example: { error: "Credenciales incorrectas." }
                            }
                        }
                    }
                }
            }
        },
        "/api/auth/register": {
            post: {
                tags: ["auth"],
                summary: "Registrar cuenta de cliente (a partir del DNI)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["dniCli", "password"],
                                properties: {
                                    dniCli: { type: "integer", example: 12345678 },
                                    password: { type: "string", example: "secreto123" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Registro exitoso.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        token: { type: "string" },
                                        idUsuario: { type: "integer" },
                                        rol: { type: "string" },
                                        idCli: { type: "integer" },
                                        passwordTemporal: { type: "boolean" },
                                        username: { type: "string" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "El DNI o email ya tienen una cuenta.",
                        content: {
                            "application/json": { schema: errorSchema }
                        }
                    }
                }
            }
        },
        "/api/auth/reset-password": {
            post: {
                tags: ["auth"],
                summary: "Restablecer contraseña con email",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "passwordNueva"],
                                properties: {
                                    email: { type: "string", format: "email" },
                                    passwordNueva: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Contraseña restablecida.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/client": {
            get: {
                tags: ["client"],
                summary: "Listar clientes",
                responses: {
                    200: {
                        description: "Listado de clientes.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Client" } }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["client"],
                summary: "Crear cliente (y su usuario de acceso)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "nameCli",
                                    "surnameCli",
                                    "phoneCli",
                                    "dniCli",
                                    "emailCli",
                                    "addressCli",
                                    "idLocation"
                                ],
                                properties: {
                                    nameCli: { type: "string", example: "Ana" },
                                    surnameCli: { type: "string", example: "Gómez" },
                                    phoneCli: { type: "string", example: "1123456789" },
                                    dniCli: { type: "integer", example: 12345678 },
                                    emailCli: { type: "string", format: "email" },
                                    addressCli: { type: "string" },
                                    idLocation: { type: "integer", example: 1 },
                                    username: { type: "string", description: "Opcional, por defecto el email" },
                                    password: { type: "string", description: "Opcional, por defecto el DNI" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Cliente creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Client" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    409: {
                        description: "Email o DNI ya registrados.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            }
        },
        "/api/client/check-email": {
            get: {
                tags: ["client"],
                summary: "Verificar disponibilidad de un email",
                parameters: [
                    {
                        name: "email",
                        in: "query",
                        required: true,
                        schema: { type: "string", format: "email" }
                    }
                ],
                responses: {
                    200: {
                        description: "Disponibilidad del email.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { available: { type: "boolean" } }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" }
                }
            }
        },
        "/api/client/me": {
            get: {
                tags: ["client"],
                summary: "Obtener el perfil del cliente autenticado",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Perfil del cliente.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Client" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["client"],
                summary: "Actualizar el perfil del cliente autenticado",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "nameCli",
                                    "surnameCli",
                                    "phoneCli",
                                    "dniCli",
                                    "emailCli",
                                    "addressCli",
                                    "idLocation"
                                ],
                                properties: {
                                    nameCli: { type: "string" },
                                    surnameCli: { type: "string" },
                                    phoneCli: { type: "string" },
                                    dniCli: { type: "integer" },
                                    emailCli: { type: "string", format: "email" },
                                    addressCli: { type: "string" },
                                    idLocation: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Perfil actualizado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        client: { $ref: "#/components/schemas/Client" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "Email o DNI ya registrados por otro cliente.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            }
        },
        "/api/client/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["client"],
                summary: "Obtener un cliente por ID",
                responses: {
                    200: {
                        description: "Cliente encontrado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Client" } }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["client"],
                summary: "Actualizar un cliente",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": { schema: { $ref: "#/components/schemas/Client" } }
                    }
                },
                responses: {
                    200: {
                        description: "Cliente actualizado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        client: { $ref: "#/components/schemas/Client" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "Email o DNI ya registrados por otro cliente.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            },
            delete: {
                tags: ["client"],
                summary: "Eliminar un cliente",
                responses: {
                    200: {
                        description: "Cliente eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/usuario/perfil": {
            get: {
                tags: ["usuario"],
                summary: "Obtener el perfil del usuario autenticado",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Perfil del usuario.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Perfil" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/usuario/cambiar-password": {
            put: {
                tags: ["usuario"],
                summary: "Cambiar la contraseña del usuario autenticado",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["passwordActual", "passwordNueva"],
                                properties: {
                                    passwordActual: { type: "string" },
                                    passwordNueva: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Perfil con la contraseña actualizada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Perfil" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/usuario/baja": {
            delete: {
                tags: ["usuario"],
                summary: "Dar de baja la propia cuenta",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Cuenta eliminada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/usuario/administradores": {
            get: {
                tags: ["usuario"],
                summary: "Listar administradores",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Listado de administradores.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Perfil" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            },
            post: {
                tags: ["usuario"],
                summary: "Crear un administrador",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: { type: "string" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Administrador creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Perfil" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    409: {
                        description: "Ya existe un usuario con ese nombre.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            }
        },
        "/api/usuario/administradores/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["usuario"],
                summary: "Actualizar un administrador",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    username: { type: "string" },
                                    password: { type: "string", description: "Opcional" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Administrador actualizado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Perfil" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "Ya existe un usuario con ese nombre.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            },
            delete: {
                tags: ["usuario"],
                summary: "Eliminar un administrador",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Administrador eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/lounge": {
            get: {
                tags: ["lounge"],
                summary: "Listar salones",
                responses: {
                    200: {
                        description: "Listado de salones.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Lounge" } }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["lounge"],
                summary: "Crear un salón",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "loungeAddress", "idLocation"],
                                properties: {
                                    name: { type: "string" },
                                    loungeAddress: { type: "string" },
                                    idLocation: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Salón creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Lounge" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" }
                }
            }
        },
        "/api/lounge/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["lounge"],
                summary: "Obtener un salón por ID",
                responses: {
                    200: {
                        description: "Salón encontrado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Lounge" } }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["lounge"],
                summary: "Actualizar un salón",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "loungeAddress", "idLocation"],
                                properties: {
                                    name: { type: "string" },
                                    loungeAddress: { type: "string" },
                                    idLocation: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Salón actualizado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Lounge" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["lounge"],
                summary: "Eliminar un salón",
                responses: {
                    200: {
                        description: "Salón eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/loungeType": {
            get: {
                tags: ["loungeType"],
                summary: "Listar tipos de salón",
                responses: {
                    200: {
                        description: "Listado de tipos de salón.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/LoungeType" }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["loungeType"],
                summary: "Crear un tipo de salón",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nameLoungeType", "minQuantity", "maxQuantity", "idLounge"],
                                properties: {
                                    nameLoungeType: { type: "string" },
                                    minQuantity: { type: "integer" },
                                    maxQuantity: { type: "integer" },
                                    idLounge: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Tipo de salón creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/LoungeType" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "Ya existe un tipo de salón con ese nombre en el salón.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            }
        },
        "/api/loungeType/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["loungeType"],
                summary: "Obtener un tipo de salón por ID",
                responses: {
                    200: {
                        description: "Tipo de salón encontrado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/LoungeType" } }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["loungeType"],
                summary: "Actualizar un tipo de salón",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nameLoungeType", "minQuantity", "maxQuantity", "idLounge"],
                                properties: {
                                    nameLoungeType: { type: "string" },
                                    minQuantity: { type: "integer" },
                                    maxQuantity: { type: "integer" },
                                    idLounge: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Tipo de salón actualizado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/LoungeType" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "Ya existe un tipo de salón con ese nombre en el salón.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            },
            delete: {
                tags: ["loungeType"],
                summary: "Eliminar un tipo de salón",
                responses: {
                    200: {
                        description: "Tipo de salón eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/locations": {
            get: {
                tags: ["location"],
                summary: "Listar ubicaciones",
                responses: {
                    200: {
                        description: "Listado de ubicaciones.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Location" } }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["location"],
                summary: "Crear una ubicación",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["city", "zipCode"],
                                properties: {
                                    city: { type: "string" },
                                    zipCode: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Ubicación creada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Location" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" }
                }
            }
        },
        "/api/locations/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["location"],
                summary: "Obtener una ubicación por ID",
                responses: {
                    200: {
                        description: "Ubicación encontrada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Location" } }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["location"],
                summary: "Actualizar una ubicación",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["city", "zipCode"],
                                properties: {
                                    city: { type: "string" },
                                    zipCode: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Ubicación actualizada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Location" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["location"],
                summary: "Eliminar una ubicación",
                responses: {
                    200: {
                        description: "Ubicación eliminada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/price": {
            get: {
                tags: ["price"],
                summary: "Listar precios",
                responses: {
                    200: {
                        description: "Listado de precios.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Price" } }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["price"],
                summary: "Crear un precio",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["effectiveDate", "value", "idLoungeType"],
                                properties: {
                                    effectiveDate: { type: "string", format: "date" },
                                    endDate: { type: "string", format: "date", nullable: true },
                                    value: { type: "number" },
                                    idLoungeType: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Precio creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Price" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/price/activo/{idLoungeType}/{dateEvent}": {
            get: {
                tags: ["price"],
                summary: "Obtener el precio activo de un tipo de salón para una fecha",
                parameters: [
                    { name: "idLoungeType", in: "path", required: true, schema: { type: "integer" } },
                    { name: "dateEvent", in: "path", required: true, schema: { type: "string", format: "date" } }
                ],
                responses: {
                    200: {
                        description: "Precio activo o `null` si no hay ninguno vigente.",
                        content: {
                            "application/json": {
                                schema: {
                                    nullable: true,
                                    allOf: [{ $ref: "#/components/schemas/Price" }]
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/price/{idLoungeType}/{effectiveDate}": {
            parameters: [
                { name: "idLoungeType", in: "path", required: true, schema: { type: "integer" } },
                { name: "effectiveDate", in: "path", required: true, schema: { type: "string", format: "date" } }
            ],
            get: {
                tags: ["price"],
                summary: "Obtener un precio por tipo de salón y fecha",
                responses: {
                    200: {
                        description: "Precio encontrado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Price" } }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["price"],
                summary: "Actualizar un precio",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["value"],
                                properties: {
                                    value: { type: "number" },
                                    endDate: { type: "string", format: "date", nullable: true }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Precio actualizado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Price" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["price"],
                summary: "Eliminar un precio",
                responses: {
                    200: {
                        description: "Precio eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/reservation": {
            get: {
                tags: ["reservation"],
                summary: "Listar todas las reservas (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Listado de reservas.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Reservation" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            },
            post: {
                tags: ["reservation"],
                summary: "Crear una reserva (el dueño es el usuario autenticado)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["dateEvent", "status", "cantInvit", "idLounge", "idLoungeType"],
                                properties: {
                                    dateEvent: { type: "string", format: "date" },
                                    status: { type: "string", example: "pendiente" },
                                    eventType: { type: "string", nullable: true },
                                    cantInvit: { type: "integer" },
                                    maxCantInvit: { type: "integer", nullable: true },
                                    idLounge: { type: "integer" },
                                    idLoungeType: { type: "integer" },
                                    idCardDetail: { type: "integer", nullable: true },
                                    idServices: { type: "array", items: { type: "integer" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Reserva creada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Reservation" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    409: {
                        description: "El salón no está disponible en esa fecha.",
                        content: {
                            "application/json": {
                                schema: errorSchema,
                                example: { error: "El salón no se encuentra disponible para la fecha seleccionada." }
                            }
                        }
                    }
                }
            }
        },
        "/api/reservation/mis-reservas": {
            get: {
                tags: ["reservation"],
                summary: "Listar las reservas del cliente autenticado",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Reservas del cliente.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Reservation" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/reservation/{id}/status": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["reservation"],
                summary: "Cambiar el estado de una reserva (admin). Aceptar genera el contrato",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["status"],
                                properties: {
                                    status: {
                                        type: "string",
                                        enum: ["pendiente", "aceptada", "confirmada", "cancelada"]
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Estado actualizado (y contrato generado si corresponde).",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        reservation: {
                                            nullable: true,
                                            allOf: [{ $ref: "#/components/schemas/Reservation" }]
                                        },
                                        contract: {
                                            nullable: true,
                                            allOf: [{ $ref: "#/components/schemas/Contract" }]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            }
        },
        "/api/reservation/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["reservation"],
                summary: "Obtener una reserva por ID (con control de pertenencia)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Reserva encontrada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Reservation" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["reservation"],
                summary: "Actualizar una reserva (solo en estado pendiente)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    dateEvent: { type: "string", format: "date" },
                                    status: { type: "string" },
                                    eventType: { type: "string", nullable: true },
                                    cantInvit: { type: "integer" },
                                    maxCantInvit: { type: "integer", nullable: true },
                                    idCli: { type: "integer" },
                                    idLounge: { type: "integer" },
                                    idLoungeType: { type: "integer" },
                                    idCardDetail: { type: "integer", nullable: true },
                                    idServices: { type: "array", items: { type: "integer" } }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Reserva actualizada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        reservation: { $ref: "#/components/schemas/Reservation" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["reservation"],
                summary: "Cancelar una reserva (baja lógica). El admin debe indicar motivo",
                security: bearerAuth,
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    motivo: { type: "string", description: "Requerido para el admin" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Reserva eliminada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/extraService": {
            get: {
                tags: ["extraService"],
                summary: "Listar servicios extra",
                responses: {
                    200: {
                        description: "Listado de servicios extra.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/ExtraService" } }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["extraService"],
                summary: "Crear un servicio extra",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nameService", "detailService", "cost"],
                                properties: {
                                    nameService: { type: "string" },
                                    detailService: { type: "string" },
                                    cost: { type: "number" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Servicio extra creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/ExtraService" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            }
        },
        "/api/extraService/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["extraService"],
                summary: "Obtener un servicio extra por ID (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Servicio extra encontrado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/ExtraService" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["extraService"],
                summary: "Actualizar un servicio extra",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["nameService", "detailService", "cost"],
                                properties: {
                                    nameService: { type: "string" },
                                    detailService: { type: "string" },
                                    cost: { type: "number" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Servicio extra actualizado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        extraService: { $ref: "#/components/schemas/ExtraService" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["extraService"],
                summary: "Eliminar un servicio extra",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Servicio extra eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/cardDetail": {
            get: {
                tags: ["cardDetail"],
                summary: "Listar tarjetas de menú",
                responses: {
                    200: {
                        description: "Listado de tarjetas de menú.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/CardDetail" } }
                            }
                        }
                    }
                }
            },
            post: {
                tags: ["cardDetail"],
                summary: "Crear una tarjeta de menú (multipart con imagen)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["menuStage", "detail", "budget"],
                                properties: {
                                    menuStage: { type: "string" },
                                    detail: { type: "string" },
                                    budget: { type: "number" },
                                    starter: { type: "string" },
                                    mainCourse: { type: "string" },
                                    dessert: { type: "string" },
                                    image: { type: "string", format: "binary" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Tarjeta de menú creada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/CardDetail" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            }
        },
        "/api/cardDetail/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["cardDetail"],
                summary: "Obtener una tarjeta de menú por ID",
                responses: {
                    200: {
                        description: "Tarjeta de menú encontrada.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/CardDetail" } }
                        }
                    },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["cardDetail"],
                summary: "Actualizar una tarjeta de menú (multipart)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    menuStage: { type: "string" },
                                    detail: { type: "string" },
                                    budget: { type: "number" },
                                    starter: { type: "string" },
                                    mainCourse: { type: "string" },
                                    dessert: { type: "string" },
                                    image: { type: "string", format: "binary" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Tarjeta de menú actualizada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        cardDetail: { $ref: "#/components/schemas/CardDetail" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["cardDetail"],
                summary: "Eliminar una tarjeta de menú",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Tarjeta de menú eliminada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract": {
            get: {
                tags: ["contract"],
                summary: "Listar todos los contratos (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Listado de contratos.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Contract" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            },
            post: {
                tags: ["contract"],
                summary: "Generar un contrato a partir de una reserva (admin)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["idReservation"],
                                properties: { idReservation: { type: "integer" } }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Contrato generado (o el existente si ya había uno).",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/mis-contratos": {
            get: {
                tags: ["contract"],
                summary: "Listar los contratos del cliente autenticado",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Contratos del cliente.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Contract" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/contract/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["contract"],
                summary: "Obtener un contrato por ID (con cálculo de valores)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Contrato con `calc`.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Contract" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["contract"],
                summary: "Actualizar un contrato (estados generado/rechazado/modificacion_en_curso)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    dateEvent: { type: "string", format: "date" },
                                    eventType: { type: "string" },
                                    idCardDetail: { type: "integer", nullable: true },
                                    idServices: { type: "array", items: { type: "integer" } },
                                    cantExactaInvit: { type: "integer" },
                                    eventStartTime: { type: "string", example: "21:00" },
                                    eventEndTime: { type: "string", example: "04:00" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Contrato actualizado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "El salón no está disponible en la nueva fecha.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            },
            delete: {
                tags: ["contract"],
                summary: "Eliminar/anular un contrato (admin, requiere motivo)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["motivo"],
                                properties: { motivo: { type: "string" } }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Contrato eliminado y evento dado de baja.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/{id}/edit": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["contract"],
                summary: "Actualizar un contrato como admin (omite el control de estado)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    eventStartTime: { type: "string", example: "21:00" },
                                    eventEndTime: { type: "string", example: "04:00" },
                                    cantExactaInvit: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Contrato actualizado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/{id}/enviar": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            post: {
                tags: ["contract"],
                summary: "Enviar el contrato a revisión (cliente)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Contrato enviado a revisión.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/{id}/aceptar": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            post: {
                tags: ["contract"],
                summary: "Firmar el contrato (cliente). Requiere revisión aprobada",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Contrato firmado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/{id}/revision": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["contract"],
                summary: "Aprobar o rechazar la revisión de un contrato (admin)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["decision"],
                                properties: {
                                    decision: { type: "string", enum: ["aprobar", "rechazar"] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Revisión registrada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/{id}/modificacion": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["contract"],
                summary: "Solicitar una modificación sobre un contrato firmado (cliente)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    dateEvent: { type: "string", format: "date" },
                                    eventType: { type: "string" },
                                    idCardDetail: { type: "integer", nullable: true },
                                    idServices: { type: "array", items: { type: "integer" } },
                                    cantExactaInvit: { type: "integer" },
                                    eventStartTime: { type: "string" },
                                    eventEndTime: { type: "string" },
                                    comment: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Solicitud registrada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" },
                    409: {
                        description: "El salón no está disponible en la nueva fecha.",
                        content: { "application/json": { schema: errorSchema } }
                    }
                }
            }
        },
        "/api/contract/{id}/modificacion/revision": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["contract"],
                summary: "Aprobar o rechazar una solicitud de modificación (admin)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["decision"],
                                properties: {
                                    decision: { type: "string", enum: ["aprobar", "rechazar"] },
                                    motivo: { type: "string", description: "Requerido al rechazar" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Modificación procesada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: { $ref: "#/components/schemas/Contract" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/contract/{id}/modificacion/rechazo": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            post: {
                tags: ["contract"],
                summary: "Responder a una modificación rechazada (cliente: continuar o cancelar)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["decision"],
                                properties: {
                                    decision: { type: "string", enum: ["continuar", "cancelar"] }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Decisión registrada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        contract: {
                                            nullable: true,
                                            allOf: [{ $ref: "#/components/schemas/Contract" }]
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/notificacion": {
            get: {
                tags: ["notificacion"],
                summary: "Listar las notificaciones del usuario autenticado",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Notificaciones y contador de no leídas.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        notifications: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Notification" }
                                        },
                                        unread: { type: "integer" }
                                    }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/notificacion/contador": {
            get: {
                tags: ["notificacion"],
                summary: "Contador de notificaciones no leídas del usuario autenticado",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Contador de no leídas.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { unread: { type: "integer" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/notificacion/{id}/leida": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            put: {
                tags: ["notificacion"],
                summary: "Marcar una notificación como leída",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Resultado de la operación.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { ok: { type: "boolean" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/notificacion/marcar-todas": {
            put: {
                tags: ["notificacion"],
                summary: "Marcar todas las notificaciones como leídas",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Operación exitosa.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { ok: { type: "boolean" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/notificacion/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            delete: {
                tags: ["notificacion"],
                summary: "Eliminar una notificación",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Resultado de la operación.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { ok: { type: "boolean" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/payment": {
            get: {
                tags: ["payment"],
                summary: "Listar pagos (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Listado de pagos.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Payment" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            },
            post: {
                tags: ["payment"],
                summary: "Crear un pago (admin)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["value", "idContract"],
                                properties: {
                                    value: { type: "number" },
                                    idContract: { type: "integer" },
                                    statusPayment: {
                                        type: "string",
                                        enum: ["pendiente", "seña", "pagado"],
                                        default: "pendiente"
                                    },
                                    datePayment: { type: "string", format: "date" },
                                    concept: { type: "string", example: "Seña" },
                                    dueDate: { type: "string", format: "date" },
                                    notes: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: {
                        description: "Pago creado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Payment" } }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/payment/{id}": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["payment"],
                summary: "Obtener un pago por ID (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Pago encontrado.",
                        content: {
                            "application/json": { schema: { $ref: "#/components/schemas/Payment" } }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            put: {
                tags: ["payment"],
                summary: "Actualizar un pago (admin)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    value: { type: "number" },
                                    statusPayment: {
                                        type: "string",
                                        enum: ["pendiente", "seña", "pagado"]
                                    },
                                    datePayment: { type: "string", format: "date" },
                                    concept: { type: "string" },
                                    dueDate: { type: "string", format: "date", nullable: true },
                                    notes: { type: "string", nullable: true },
                                    idContract: { type: "integer" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Pago actualizado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        payment: { $ref: "#/components/schemas/Payment" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            },
            delete: {
                tags: ["payment"],
                summary: "Eliminar un pago (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Pago eliminado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { message: { type: "string" } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/payment/settings": {
            get: {
                tags: ["payment"],
                summary: "Obtener configuración de pagos (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Configuración actual.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        depositPercentage: { type: "number", example: 30 },
                                        reminderDaysBeforeEvent: { type: "integer", example: 7 },
                                        remindersEnabled: { type: "boolean", example: true }
                                    }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            },
            put: {
                tags: ["payment"],
                summary: "Actualizar configuración de pagos (admin)",
                security: bearerAuth,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    depositPercentage: { type: "number", minimum: 0, maximum: 100 },
                                    reminderDaysBeforeEvent: { type: "integer", minimum: 0, maximum: 365 },
                                    remindersEnabled: { type: "boolean" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Configuración actualizada.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        settings: {
                                            type: "object",
                                            properties: {
                                                depositPercentage: { type: "number" },
                                                reminderDaysBeforeEvent: { type: "integer" },
                                                remindersEnabled: { type: "boolean" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            }
        },
        "/api/payment/reminders/run": {
            get: {
                tags: ["payment"],
                summary: "Ejecutar recordatorios automáticos (Vercel Cron)",
                description: "Requiere el header Authorization: Bearer <CRON_SECRET>.",
                responses: {
                    200: {
                        description: "Resultado del proceso.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        processed: { type: "integer" },
                                        sent: { type: "integer" },
                                        skipped: { type: "integer" }
                                    }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            },
            post: {
                tags: ["payment"],
                summary: "Ejecutar recordatorios automáticos (manual)",
                description: "Requiere el header Authorization: Bearer <CRON_SECRET>.",
                responses: {
                    200: { description: "Resultado del proceso." },
                    401: { $ref: "#/components/responses/Unauthorized" }
                }
            }
        },
        "/api/payment/pending/count": {
            get: {
                tags: ["payment"],
                summary: "Contar pagos pendientes (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Cantidad de pagos pendientes.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { count: { type: "integer", example: 3 } }
                                }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" }
                }
            }
        },
        "/api/payment/contract/{idContract}": {
            parameters: [
                { name: "idContract", in: "path", required: true, schema: { type: "integer" } }
            ],
            get: {
                tags: ["payment"],
                summary: "Listar pagos de un contrato (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Pagos del contrato.",
                        content: {
                            "application/json": {
                                schema: { type: "array", items: { $ref: "#/components/schemas/Payment" } }
                            }
                        }
                    },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        },
        "/api/payment/{id}/reminder": {
            parameters: [
                { name: "id", in: "path", required: true, schema: { type: "integer" } }
            ],
            post: {
                tags: ["payment"],
                summary: "Enviar recordatorio de un pago (admin)",
                security: bearerAuth,
                responses: {
                    200: {
                        description: "Recordatorio enviado.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        sent: { type: "boolean" }
                                    }
                                }
                            }
                        }
                    },
                    400: { $ref: "#/components/responses/ValidationError" },
                    401: { $ref: "#/components/responses/Unauthorized" },
                    403: { $ref: "#/components/responses/Forbidden" },
                    404: { $ref: "#/components/responses/NotFound" }
                }
            }
        }
    }
};

export default openapi;
