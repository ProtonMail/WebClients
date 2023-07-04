import { DRAFT_MIME_TYPES, PACKAGE_TYPE, SHOW_IMAGES } from '../constants';
import { BLOCK_SENDER_CONFIRMATION } from '../mail/constants';

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

export enum SpamAction {
    JustSpam = 0,
    SpamAndUnsub = 1,
}

/**
 * ACTIVE: User has 30 days by default. Could be another number.
 *
 * DISABLED: user explicitely disabled the feature.
 *
 * Can also be null if no preferences are defined yet.
 */
export enum AutoDeleteSpamAndTrashDaysSetting {
    ACTIVE = 30,
    DISABLED = 0,
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
    ShowImages: number; // Soon deprecated, use HideRemoteImages or HideEmbeddedImages instead
    ShowMoved: number;
    ViewMode: number;
    ViewLayout: number;
    SwipeLeft: number;
    SwipeRight: number;
    AlsoArchive: number;
    HideEmbeddedImages: SHOW_IMAGES;
    HideRemoteImages: SHOW_IMAGES;
    /** @deprecated use Shortcuts instead */
    Hotkeys: number; // used by v3 (Angular)
    Shortcuts: number; // used by v4
    PMSignature: number;
    PMSignatureReferralLink: number;
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
    /**
     * FontFace value is a FONT_FACES.${FONT}.id value or null.
     */
    FontFace: string | null;
    FontSize: number | null;
    SpamAction: SpamAction | null;
    BlockSenderConfirmation: BLOCK_SENDER_CONFIRMATION | null;
    HideSenderImages: number;
    AutoDeleteSpamAndTrashDays: AutoDeleteSpamAndTrashDaysSetting;
    UnreadFavicon: number;
    RecipientLimit: number;
}
