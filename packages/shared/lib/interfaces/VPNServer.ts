export interface ServerLocation {
    Lat: number;
    Long: number;
}

interface Server {
    Domain: string;
    EntryIP: string;
    ExitIP: string;
    ID: string;
    Status: number;
}

export interface VPNServer {
    City: string | null;
    Country: string;
    Domain: string;
    EntryCountry: string;
    ExitCountry: string;
    Features: number;
    ID: string;
    Load: number;
    Location: ServerLocation;
    Name: string;
    Score: number;
    Servers: Server[];
    Status: number;
    Tier: number;
}
