import { DRAFT_MIME_TYPES } from '../constants';

export interface MailSettings {
    DisplayName: string;
    Signature: string;
    Theme: string;
    AutoResponder: {
        StartTime: number;
        Endtime: number;
        Repeat: number;
        DaysSelected: number[];
        Subject: string;
        Message: string;
        IsEnabled: boolean;
        Zone: string;
    };
    AutoSaveContacts: number;
    AutoWildcardSearch: number;
    ComposerMode: number;
    MessageButtons: number;
    ShowImages: number;
    ShowMoved: number;
    ViewMode: number;
    ViewLayout: number;
    SwipeLeft: number;
    SwipeRight: number;
    AlsoArchive: number;
    Hotkeys: number; // used by v3 (Angular)
    Shortcuts: number; // used by v4
    PMSignature: number;
    ImageProxy: number;
    TLS: number;
    RightToLeft: number;
    AttachPublicKey: number;
    Sign: number;
    PGPScheme: number;
    PromptPin: number;
    Autocrypt: number;
    NumMessagePerPage: number;
    DraftMIMEType: DRAFT_MIME_TYPES;
    ReceiveMIMEType: string;
    ShowMIMEType: string;
    StickyLabels: number;
    ConfirmLink: number;
    DelaySendSeconds: number;
    EnableFolderColor: number;
    InheritParentFolderColor: number;
}
