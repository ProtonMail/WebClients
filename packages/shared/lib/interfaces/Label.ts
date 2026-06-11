export interface Label {
    ID: string;
    Name: string;
    Color: string;
    ContextTime?: number;
    Type: number;
    Order: number;
    Path: string;
    Display?: number;
    Notify?: number;
    LastUnseenMessageEventID: number | null;
}

export interface LabelCount {
    LabelID?: string;
    Total?: number;
    Unread?: number;
}

export interface SafeLabelCount {
    LabelID: string;
    Total: number;
    Unread: number;
}
