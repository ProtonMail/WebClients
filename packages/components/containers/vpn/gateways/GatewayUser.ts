import type { USER_ROLES } from '@proton/shared/lib/constants';

export interface GatewayUser {
    ID: string;
    Email: string;
    Name: string | null;
    Role?: USER_ROLES;
}
