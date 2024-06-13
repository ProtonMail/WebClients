export interface PassEvent {
    // id: number;
    time: string;
    user: {
        name: string;
        email: string;
    };
    event: string;
    ip: string;
}
