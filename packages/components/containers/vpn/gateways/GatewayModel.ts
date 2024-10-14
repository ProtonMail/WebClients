import type { GatewayLocation } from './GatewayLocation';

export interface GatewayModel {
    Name?: string;
    Location?: GatewayLocation;
    Features?: number;
    UserIds?: readonly string[] | null;
    Quantities?: Record<string, number>;
}
