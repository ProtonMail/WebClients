export interface VPNEvent {
    time: string;
    user: {
        name: string;
        email: string;
    };
    event: string;
    eventType: string;
    eventTypeName: string;
    origin: {
        location: string;
        ip: string;
        emoji: string;
        countryCode: string;
    };
    gateway: {
        name: string;
        emoji: string;
        countryCode: string;
    };
    deviceName?: string;
}
