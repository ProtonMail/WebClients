import { Server } from './Server';

export interface Logical {
    ID: string;
    City?: string | null;
    DisplayTier: number;
    Domain: string;
    EntryCountry: string;
    ExitCountry: string;
    HostCountry: string;
    Features: number; // bitmap
    Location: { Lat: number; Long: number };
    Name: string;
    Region?: string | null;
    ServerIDs?: number[];
    UserIDs?: (string | number)[];
    Servers?: Server[];
    Tier: number;
    Visible: boolean | number;
    Score: number;
    Load?: number;
}
