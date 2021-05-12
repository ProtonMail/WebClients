export interface Label {
    ID: string;
    Name: string;
    Color: string;
    ContextTime?: number;
    Type: number;
    Order: number;
    Path: string;
}

export interface LabelCount {
    LabelID?: string;
    Total?: number;
    Unread?: number;
}
