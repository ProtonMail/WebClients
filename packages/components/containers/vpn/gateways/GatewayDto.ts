export interface GatewayDto {
    name?: string;
    country: string;
    quantities?: Record<string, number>;
    features: number;
    userIds: readonly string[];
}
