import type { GatewayLocation } from './GatewayLocation';

export interface GatewayDto {
    name?: string;
    location: GatewayLocation;
    quantities?: Record<string, number>;
    unassignedIpQuantities: Record<string, number>;
    features: number;
    userIds: readonly string[];
}
