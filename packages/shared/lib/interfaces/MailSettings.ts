import type { BLOCK_SENDER_CONFIRMATION } from '../mail/constants';
import type {
    ALMOST_ALL_MAIL,
    ATTACH_PUBLIC_KEY,
    AUTO_DELETE_SPAM_AND_TRASH_DAYS,
    AUTO_SAVE_CONTACTS,
    COMPOSER_MODE,
    CONFIRM_LINK,
    DELAY_IN_SECONDS,
    DIRECTION,
    DRAFT_MIME_TYPES,
    FOLDER_COLOR,
    HIDE_SENDER_IMAGES,
    INHERIT_PARENT_FOLDER_COLOR,
    KEY_TRANSPARENCY_SETTING,
    MAIL_PAGE_SIZE,
    MESSAGE_BUTTONS,
    NEXT_MESSAGE_ON_MOVE,
    PACKAGE_TYPE,
    PM_SIGNATURE,
    PM_SIGNATURE_REFERRAL,
    PROMPT_PIN,
    REMOVE_IMAGE_METADATA,
    SHORTCUTS,
    SHOW_IMAGES,
    SIGN,
    SPAM_ACTION,
    STICKY_LABELS,
    SWIPE_ACTION,
    UNREAD_FAVICON,
    VIEW_LAYOUT,
    VIEW_MODE,
} from '../mail/mailSettings';

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

// Update the useMailSettingsHeartbeat hook when adding a new settings
export interface MailSettings {
    DisplayName: string;
    Signature: string;
    Theme: string;
    AutoResponder: AutoResponder;
    AutoSaveContacts: AUTO_SAVE_CONTACTS;
    ComposerMode: COMPOSER_MODE;
    MessageButtons: MESSAGE_BUTTONS;
    ShowMoved: number;
    ViewMode: VIEW_MODE;
    ViewLayout: VIEW_LAYOUT;
    SwipeLeft: SWIPE_ACTION; // default 3
    SwipeRight: SWIPE_ACTION; // default 0
    PageSize: MAIL_PAGE_SIZE;
    HideEmbeddedImages: SHOW_IMAGES;
    HideRemoteImages: SHOW_IMAGES;
    Shortcuts: SHORTCUTS; // used by v4
    PMSignature: PM_SIGNATURE;
    PMSignatureReferralLink: PM_SIGNATURE_REFERRAL;
    ImageProxy: number;
    RightToLeft: DIRECTION;
    AttachPublicKey: ATTACH_PUBLIC_KEY;
    Sign: SIGN;
    PGPScheme: PACKAGE_TYPE;
    PromptPin: PROMPT_PIN;
    NumMessagePerPage: number;
    DraftMIMEType: DRAFT_MIME_TYPES;
    StickyLabels: STICKY_LABELS;
    ConfirmLink: CONFIRM_LINK;
    DelaySendSeconds: DELAY_IN_SECONDS;
    EnableFolderColor: FOLDER_COLOR;
    InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR;
    /**
     * FontFace value is a FONT_FACES.${FONT}.id value or null.
     */
    FontFace: string | null;
    FontSize: number | null;
    SpamAction: SPAM_ACTION | null;
    BlockSenderConfirmation: BLOCK_SENDER_CONFIRMATION | null;
    HideSenderImages: HIDE_SENDER_IMAGES;
    AutoDeleteSpamAndTrashDays: AUTO_DELETE_SPAM_AND_TRASH_DAYS | null;
    UnreadFavicon: UNREAD_FAVICON;
    RecipientLimit: number;
    AlmostAllMail: ALMOST_ALL_MAIL;
    ReceiveMIMEType: string;
    ShowMIMEType: string;
    NextMessageOnMove: NEXT_MESSAGE_ON_MOVE;
    RemoveImageMetadata: REMOVE_IMAGE_METADATA;
    KT: KEY_TRANSPARENCY_SETTING;
}
