import { DRAFT_MIME_TYPES, PACKAGE_TYPE } from '../constants';

export interface AutoResponder {
    StartTime: number;
    EndTime: number;
    Repeat: number;
    DaysSelected: number[];
    Subject: string;
    Message: string;
    IsEnabled: boolean;
    Zone: string;
}

export interface MailSettings {
    DisplayName: string;
    Signature: string;
    Theme: string;
    AutoResponder: AutoResponder;
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
    PGPScheme: PACKAGE_TYPE;
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
