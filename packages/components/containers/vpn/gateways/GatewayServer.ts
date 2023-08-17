export interface GatewayServer {
    ID: string;
    Domain: string;
    Label: string;
    Enabled: boolean;
    EntryIPv4: string;
    EntryIPv6: string | null;
    ExitIPv4: string;
    ExitIPv6: string | null;
    Load: number;
}
