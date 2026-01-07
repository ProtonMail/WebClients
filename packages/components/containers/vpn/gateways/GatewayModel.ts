import type { GatewayLocation } from './GatewayLocation';

export interface GatewayModel {
    Name?: string;
    Location?: GatewayLocation;
    Features?: number;
    UserIds?: string[] | null;
    Quantities?: Record<string, number>;
    GroupIds?: string[] | null;
}
