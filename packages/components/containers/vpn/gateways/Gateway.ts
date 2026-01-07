import type { GatewayLogical } from './GatewayLogical';
import type { GatewayUser } from './GatewayUser';

export interface Gateway {
    Name: string;
    ExitCountry: string;
    Logicals: GatewayLogical[];
    Users: GatewayUser[];
    GroupIds: string[] | null;
}
