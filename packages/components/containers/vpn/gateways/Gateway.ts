import { GatewayLogical } from './GatewayLogical';
import { GatewayUser } from './GatewayUser';

export interface Gateway {
    Name: string;
    ExitCountry: string;
    Logicals: GatewayLogical[];
    Users: GatewayUser[];
}
