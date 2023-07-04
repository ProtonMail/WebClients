import { IMAGE_PROXY_FLAGS, MIME_TYPES, SHOW_IMAGES } from '../../constants';
import { Address, MailSettings, UserSettings } from '../../interfaces';

export const eoDefaultUserSettings = {
    Referral: undefined,
} as UserSettings;

export const EO_REPLY_NUM_ATTACHMENTS_LIMIT = 10;

export const eoDefaultMailSettings: MailSettings = {
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
    AutoSaveContacts: 1,
    AutoWildcardSearch: 1,
    ComposerMode: 0,
    MessageButtons: 0,
    ShowImages: SHOW_IMAGES.HIDE,
    HideRemoteImages: SHOW_IMAGES.HIDE,
    HideEmbeddedImages: SHOW_IMAGES.HIDE,
    ShowMoved: 0,
    ViewMode: 0,
    ViewLayout: 0,
    SwipeLeft: 3,
    SwipeRight: 0,
    AlsoArchive: 0,
    Hotkeys: 0,
    Shortcuts: 1,
    PMSignature: 0,
    ImageProxy: IMAGE_PROXY_FLAGS.NONE,
    TLS: 0,
    RightToLeft: 0,
    AttachPublicKey: 0,
    Sign: 0,
    PGPScheme: 16,
    PromptPin: 0,
    Autocrypt: 0,
    NumMessagePerPage: 50,
    DraftMIMEType: MIME_TYPES.DEFAULT,
    ReceiveMIMEType: MIME_TYPES.DEFAULT,
    ShowMIMEType: MIME_TYPES.DEFAULT,
    StickyLabels: 0,
    ConfirmLink: 1,
    DelaySendSeconds: 10,
    EnableFolderColor: 0,
    InheritParentFolderColor: 1,
    FontFace: null,
    FontSize: null,
    PMSignatureReferralLink: 0,
    SpamAction: null,
    BlockSenderConfirmation: null,
    HideSenderImages: 0,
    AutoDeleteSpamAndTrashDays: 0,
    UnreadFavicon: 0,
    RecipientLimit: 100,
};

export const eoDefaultAddress = {} as Address[];
