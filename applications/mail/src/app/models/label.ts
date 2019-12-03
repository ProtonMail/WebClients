export interface Label {
    ID?: string;
    Name?: string;
    Color?: string;
    ContextTime?: number;
    Exclusive?: number;
}

export interface LabelCount {
    LabelID?: string;
    Total?: number;
    Unread?: number;
}
