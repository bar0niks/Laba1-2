export declare const API_ROUTES: {
    readonly auth: {
        readonly register: "/api/auth/register";
        readonly login: "/api/auth/login";
        readonly me: "/api/auth/me";
    };
    readonly clients: {
        readonly me: "/api/clients/me";
        readonly membership: "/api/clients/me/membership";
        readonly visits: "/api/clients/me/visits";
    };
};
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly CLIENT: "client";
};
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
