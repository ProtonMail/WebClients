export interface GatewayModel {
    Name?: string;
    Country?: string;
    Features?: number;
    UserIds?: readonly string[] | null;
    Quantities?: Record<string, number>;
}
