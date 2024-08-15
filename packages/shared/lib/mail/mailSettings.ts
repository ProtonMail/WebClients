import { MIME_TYPES } from '../constants';
import type { MailSettings } from '../interfaces';

export const MAX_RECIPIENTS = 100;

export type DRAFT_MIME_TYPES = MIME_TYPES.PLAINTEXT | MIME_TYPES.DEFAULT;

export enum SHOW_MOVED {
    NONE = 0,
    DRAFTS = 1,
    SENT = 2,
    DRAFTS_AND_SENT = 3,
}

export enum HIDE_SENDER_IMAGES {
    SHOW = 0,
    HIDE = 1,
}

export enum SHOW_IMAGES {
    SHOW = 0,
    HIDE = 1,
}

export enum IMAGE_PROXY_FLAGS {
    NONE = 0,
    INCORPORATOR = 1,
    PROXY = 2,
    ALL = 3,
}

export enum VIEW_LAYOUT {
    COLUMN = 0,
    ROW = 1,
}

export enum VIEW_MODE {
    GROUP = 0,
    SINGLE = 1,
}

export enum COMPOSER_MODE {
    POPUP = 0,
    MAXIMIZED = 1,
}

export enum MESSAGE_BUTTONS {
    READ_UNREAD = 0,
    UNREAD_READ = 1,
}

export enum CONFIRM_LINK {
    DISABLED = 0,
    CONFIRM = 1,
}

export enum AUTO_SAVE_CONTACTS {
    DISABLED = 0,
    ENABLED = 1,
}

export enum SHORTCUTS {
    DISABLED = 0,
    ENABLED = 1,
}

export enum PM_SIGNATURE {
    DISABLED = 0,
    ENABLED = 1,
}

export enum PM_SIGNATURE_REFERRAL {
    DISABLED = 0,
    ENABLED = 1,
}

export enum FOLDER_COLOR {
    DISABLED = 0,
    ENABLED = 1,
}
export enum INHERIT_PARENT_FOLDER_COLOR {
    DISABLED = 0,
    ENABLED = 1,
}

export enum ATTACH_PUBLIC_KEY {
    DISABLED = 0,
    ENABLED = 1,
}

export enum SIGN {
    DISABLED = 0,
    ENABLED = 1,
}

export enum PACKAGE_TYPE {
    SEND_PM = 1,
    SEND_EO = 2,
    SEND_CLEAR = 4,
    SEND_PGP_INLINE = 8,
    SEND_PGP_MIME = 16,
    SEND_CLEAR_MIME = 32,
}

export enum PROMPT_PIN {
    DISABLED = 0,
    ENABLED = 1,
}

export enum STICKY_LABELS {
    DISABLED = 0,
    ENABLED = 1,
}

export enum DELAY_IN_SECONDS {
    NONE = 0,
    SMALL = 5,
    MEDIUM = 10,
    LARGE = 20,
}

export enum UNREAD_FAVICON {
    DISABLED = 0,
    ENABLED = 1,
}

export enum DIRECTION {
    LEFT_TO_RIGHT = 0,
    RIGHT_TO_LEFT = 1,
}

export enum ALMOST_ALL_MAIL {
    DISABLED = 0,
    ENABLED = 1,
}

export enum AUTO_DELETE_SPAM_AND_TRASH_DAYS {
    ACTIVE = 30,
    DISABLED = 0,
}

export enum SPAM_ACTION {
    JustSpam = 0,
    SpamAndUnsub = 1,
}

export enum SWIPE_ACTION {
    Trash = 0,
    Spam = 1,
    Star = 2,
    Archive = 3,
    MarkAsRead = 4,
}

export enum MAIL_PAGE_SIZE {
    FIFTY = 50,
    ONE_HUNDRED = 100,
    TWO_HUNDRED = 200,
}

export enum KEY_TRANSPARENCY_SETTING {
    DISABLED = 0,
    ENABLED = 1,
}

export enum NEXT_MESSAGE_ON_MOVE {
    DISABLED = 0, // disabled by the user
    DEFAULT = 1, // enabled (default value)
    ENABLED = 2, // enabled by the user
}

export enum REMOVE_IMAGE_METADATA {
    DISABLED = 0,
    ENABLED = 1,
}

export const DEFAULT_MAILSETTINGS: MailSettings = {
    DisplayName: '',
    Signature: '',
    Theme: '',
    AutoResponder: {
        StartTime: 0,
        EndTime: 0,
        Repeat: 0,
        DaysSelected: [],
        Subject: 'Auto',
        Message: '',
        IsEnabled: false,
        Zone: 'Europe/Zurich',
    },
    AutoSaveContacts: AUTO_SAVE_CONTACTS.ENABLED,
    ComposerMode: COMPOSER_MODE.POPUP,
    MessageButtons: MESSAGE_BUTTONS.READ_UNREAD,
    HideRemoteImages: SHOW_IMAGES.SHOW,
    HideEmbeddedImages: SHOW_IMAGES.SHOW,
    ShowMoved: SHOW_MOVED.NONE,
    ViewMode: VIEW_MODE.GROUP,
    ViewLayout: VIEW_LAYOUT.ROW,
    SwipeLeft: 3,
    SwipeRight: 0,
    Shortcuts: SHORTCUTS.ENABLED,
    PMSignature: PM_SIGNATURE.DISABLED,
    ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
    RightToLeft: DIRECTION.LEFT_TO_RIGHT,
    AttachPublicKey: ATTACH_PUBLIC_KEY.DISABLED,
    Sign: SIGN.DISABLED,
    PGPScheme: PACKAGE_TYPE.SEND_PGP_MIME,
    PromptPin: PROMPT_PIN.DISABLED,
    NumMessagePerPage: 50,
    DraftMIMEType: MIME_TYPES.DEFAULT,
    StickyLabels: STICKY_LABELS.DISABLED,
    ConfirmLink: CONFIRM_LINK.CONFIRM,
    DelaySendSeconds: DELAY_IN_SECONDS.MEDIUM,
    EnableFolderColor: FOLDER_COLOR.DISABLED,
    InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.ENABLED,
    FontFace: null,
    FontSize: null,
    PMSignatureReferralLink: PM_SIGNATURE_REFERRAL.DISABLED,
    SpamAction: null,
    BlockSenderConfirmation: null,
    HideSenderImages: HIDE_SENDER_IMAGES.SHOW,
    AutoDeleteSpamAndTrashDays: null,
    UnreadFavicon: UNREAD_FAVICON.DISABLED,
    RecipientLimit: MAX_RECIPIENTS,
    AlmostAllMail: ALMOST_ALL_MAIL.DISABLED,
    ReceiveMIMEType: MIME_TYPES.DEFAULT,
    ShowMIMEType: MIME_TYPES.DEFAULT,
    PageSize: MAIL_PAGE_SIZE.FIFTY,
    NextMessageOnMove: NEXT_MESSAGE_ON_MOVE.DEFAULT,
    RemoveImageMetadata: REMOVE_IMAGE_METADATA.DISABLED,
    KT: KEY_TRANSPARENCY_SETTING.DISABLED,
};
