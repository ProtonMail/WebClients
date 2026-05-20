import type { USER_ROLES } from '@proton/shared/lib/constants';

export interface GatewayLocation {
    Country: string;
    City: string;
    TranslatedCity: string;
}

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

export interface GatewayUser {
    ID: string;
    Email: string;
    Name: string | null;
    Role?: USER_ROLES;
}

export interface DeletedDedicatedIp {
    Location: GatewayLocation;
    AvailableAgainAfter: number;
    LogicalID: string;
    LogicalName: string;
    ExitIPv4: string;
}

export interface GatewayModel {
    Name?: string;
    Location?: GatewayLocation;
    Features?: number;
    UserIds?: string[] | null;
    Quantities?: Record<string, number>;
    GroupIds?: string[] | null;
}

export interface GatewayIpModel {
    Name: string;
    Location: GatewayLocation;
}

export interface GatewayMultiIpModel {
    Name: string;
    Locations: GatewayLocation[];
    Features?: number;
    UserIds?: readonly string[] | null;
    GroupIds?: readonly string[] | null;
}

export interface GatewayIpMultiIpModel {
    Name: string;
    Locations: GatewayLocation[];
}

export interface GatewayGroup {
    GroupID: string;
    Name: string;
    UserCount: number;
    Users: GatewayUser[];
}

export interface Gateway {
    Name: string;
    ExitCountry: string;
    Logicals: GatewayLogical[];
    Users: GatewayUser[];
    GroupIds: string[] | null;
}

export interface GatewayDto {
    name?: string;
    location: GatewayLocation;
    quantities?: Record<string, number>;
    unassignedIpQuantities: Record<string, number>;
    features: number;
    userIds: string[] | null;
    checkedLocations?: object[];
    groupIds: string[] | null;
}
