import { LABEL_EXCLUSIVE } from 'proton-shared/lib/constants';

export interface Label {
    ID: string;
    Name: string;
    Color: string;
    ContextTime?: number;
    Type: number;
    Order: number;
    Exclusive: LABEL_EXCLUSIVE;
}

export interface LabelCount {
    LabelID?: string;
    Total?: number;
    Unread?: number;
}
