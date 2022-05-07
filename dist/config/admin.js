"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ env }) => ({
    apiToken: {
        salt: env('API_TOKEN_SALT'),
    },
    auth: {
        secret: env('ADMIN_JWT_SECRET', '46de3c5a081e25781edb85fe892433e5'),
    },
});
