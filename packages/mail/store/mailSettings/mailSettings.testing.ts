import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import type { MailSettingState } from './index';

/**
 * Builds the `mailSettings` slice for tests, from the same initial state the slice itself.
 * This ensure that changes in `MailSettings` breaks at compilation instead of silently passing.
 */
export const mailSettingsState = (mailSettings?: Partial<MailSettings>): MailSettingState => ({
    mailSettings: getInitialModelState<MailSettings>({ ...DEFAULT_MAIL_SETTINGS, ...mailSettings }),
});

/**
 * The mail settings have not been fetched yet.
 */
export const unloadedMailSettingsState = (): MailSettingState => ({
    mailSettings: getInitialModelState<MailSettings>(),
});
