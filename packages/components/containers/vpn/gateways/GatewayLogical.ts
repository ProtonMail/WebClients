import type { GatewayServer } from './GatewayServer';

export interface GatewayLogical {
    ID: string;
    Name: string;
    EntryCountry: string;
    ExitCountry: string;
    HostCountry: string | null;
    Region: string | null;
    City: string;
    Features: number; // bitmap
    Location: { Lat: number; Long: number };
    Users: string[];
    Servers: GatewayServer[];
    Visible: boolean;
    Groups: string[];
}
