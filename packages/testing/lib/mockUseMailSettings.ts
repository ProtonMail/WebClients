import * as useMailSettingsModule from '@proton/mail/store/mailSettings/hooks';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

const defaultMailSettings: MailSettings = {
    ...DEFAULT_MAIL_SETTINGS,
    FontSize: null,
    FontFace: null,
    ViewLayout: 0,
    SwipeLeft: 0,
    SwipeRight: 1,
    PMSignature: 1,
    HideSenderImages: 0,
    DraftMIMEType: MIME_TYPES.PLAINTEXT,
    AutoDeleteSpamAndTrashDays: 0,
};

jest.mock('@proton/mail/store/mailSettings/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/mail/store/mailSettings/hooks'),
}));

export const mockUseMailSettings = (params?: [Partial<MailSettings>?, boolean?, (() => void)?]) => {
    const [value, isMissed = false] = params ?? [];

    const mockedUseMailSettings = jest.spyOn(useMailSettingsModule, 'useMailSettings');
    mockedUseMailSettings.mockReturnValue([
        {
            ...defaultMailSettings,
            ...value,
        },
        isMissed,
    ]);

    return mockedUseMailSettings;
};
