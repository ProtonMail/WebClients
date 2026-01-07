import type { GatewayUser } from './GatewayUser';

export interface GatewayGroup {
    GroupID: string;
    Name: string;
    UserCount: number;
    Users: GatewayUser[];
}
