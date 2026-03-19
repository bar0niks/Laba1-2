"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROLES = exports.API_ROUTES = void 0;
exports.API_ROUTES = {
    auth: {
        register: "/api/auth/register",
        login: "/api/auth/login",
        me: "/api/auth/me"
    },
    clients: {
        me: "/api/clients/me",
        membership: "/api/clients/me/membership",
        visits: "/api/clients/me/visits"
    }
};
exports.USER_ROLES = {
    ADMIN: "admin",
    CLIENT: "client"
};
//# sourceMappingURL=constants.js.map