import type { GatewayLocation } from './GatewayLocation';

export interface DeletedDedicatedIp {
    Location: GatewayLocation;
    AvailableAgainAfter: number;
    LogicalID: string;
    LogicalName: string;
    ExitIPv4: string;
}
