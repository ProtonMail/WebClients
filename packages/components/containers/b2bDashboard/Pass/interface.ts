export interface PassEvent {
    // id: number;
    time: string;
    user: {
        name: string;
        email: string;
    };
    event: string;
    eventType: string;
    eventTypeName: string;
    ip: string;
    eventData: {
        vaultId: string;
        itemId: string;
    };
}
