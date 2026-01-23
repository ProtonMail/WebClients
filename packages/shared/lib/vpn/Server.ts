export interface Server {
    ID?: string | number;
    Domain: string;
    EntryIP: string;
    ExitIP: string;
    EntryIPv6?: string;
    Label?: string | null;
    MaxSpeed: number;
    Generation: number;
    Enabled: boolean | number;
    ServicesDownPublicReason?: string | null;
    ServicesDownDetailedReason?: string | null;
    EndOfLife?: number | null;
    X25519PublicKey?: string | null;
    LoadUpdateTime?: number | null;
    Bytes?: number | null;
    Load?: number | null;
    ServicesDown?: number | null;
    Status?: boolean;
}
