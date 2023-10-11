import * as useMailSettingsModule from '@proton/components/hooks/useMailSettings';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/mailSettings';

const defaultMailSettings: MailSettings = {
    ...DEFAULT_MAILSETTINGS,
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
