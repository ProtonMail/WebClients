export interface PassEvent {
    time: string;
    user: {
        name: string;
        email: string;
    };
    eventType: string;
    eventTypeName: string;
    ip: string;
    eventData: {
        vaultId?: string;
        itemId?: string;
    };
}
