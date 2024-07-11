export interface VPNEvent {
    time: string;
    user: {
        name: string;
        email: string;
    };
    event: string;
    origin: {
        location: string;
        ip: string;
    };
    gateway: {
        name: string;
        emoji: string;
    };
}
