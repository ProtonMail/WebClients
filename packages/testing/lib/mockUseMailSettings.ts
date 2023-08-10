import * as useMailSettingsModule from '@proton/components/hooks/useMailSettings';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

const defaultMailSettings: MailSettings = {
    AutoSaveContacts: 1,
    AutoWildcardSearch: 1,
    ComposerMode: 0,
    FontSize: null,
    FontFace: null,
    MessageButtons: 0,
    ShowImages: 2,
    ShowMoved: 0,
    ViewMode: 0,
    ViewLayout: 0,
    SwipeLeft: 0,
    SwipeRight: 1,
    AlsoArchive: 0,
    Hotkeys: 0,
    Shortcuts: 1,
    PMSignature: 1,
    ImageProxy: 2,
    TLS: 0,
    RightToLeft: 0,
    AttachPublicKey: 0,
    Sign: 0,
    PGPScheme: 16,
    PromptPin: 0,
    Autocrypt: 0,
    StickyLabels: 0,
    ConfirmLink: 1,
    DelaySendSeconds: 10,
    Theme: '',
    DisplayName: '',
    Signature: '',
    AutoResponder: {
        StartTime: 0,
        EndTime: 0,
        DaysSelected: [],
        Repeat: 0,
        Subject: 'Auto',
        Message: '',
        IsEnabled: false,
        Zone: 'Europe/Zurich',
    },
    EnableFolderColor: 0,
    InheritParentFolderColor: 1,
    SpamAction: null,
    BlockSenderConfirmation: null,
    HideEmbeddedImages: 0,
    HideRemoteImages: 0,
    HideSenderImages: 0,
    AlmostAllMail: 0,
    UnreadFavicon: 0,
    NumMessagePerPage: 50,
    RecipientLimit: 100,
    ReceiveMIMEType: 'text/html',
    ShowMIMEType: 'text/html',
    PMSignatureReferralLink: 0,
    DraftMIMEType: MIME_TYPES.PLAINTEXT,
    AutoDeleteSpamAndTrashDays: 0,
};

export const mockUseMailSettings = (params?: [Partial<MailSettings>?, boolean?, (() => void)?]) => {
    const [value, isMissed = false, miss = jest.fn()] = params ?? [];

    const mockedUseMailSettings = jest.spyOn(useMailSettingsModule, 'useMailSettings');
    mockedUseMailSettings.mockReturnValue([
        {
            ...defaultMailSettings,
            ...value,
        },
        isMissed,
        miss,
    ]);

    return mockedUseMailSettings;
};
