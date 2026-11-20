// @vitest-environment jsdom
// jsdom kept: the rooster editor iframe needs iframe.contentDocument, which happy-dom lacks
import { waitFor } from '@testing-library/react';
import { useFlag } from '@unleash/proxy-client-react';

import { getModelState } from '@proton/account/testing/getModelState';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { setSentryTags } from '@proton/shared/lib/helpers/sentry';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import { getCompleteAddress, minimalCache } from '../../../helpers/tests/cache';
import { clearAll } from '../../../helpers/tests/helper';
import { renderComposer } from './Composer.test.helpers';

vi.mock('@proton/shared/lib/helpers/sentry', async () => ({
    ...(await vi.importActual('@proton/shared/lib/helpers/sentry')),
    setSentryTags: vi.fn(),
}));

describe('Composer editor version', () => {
    const address = getCompleteAddress({ ID: 'AddressID', Email: 'me@home.net' });

    afterEach(() => {
        clearAll();
        vi.mocked(useFlag).mockReset();
    });

    it.each([
        [false, 'roosterjs-8'],
        [true, 'roosterjs-9'],
    ])('should tag Sentry errors with the editor version when MailComposerRoosterV9 is %s', async (isOn, version) => {
        vi.mocked(useFlag).mockImplementation((name) => isOn && name === 'MailComposerRoosterV9');

        minimalCache();
        await renderComposer({
            preloadedState: {
                mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings),
                addresses: getModelState([address]),
            },
            message: { data: { MIMEType: MIME_TYPES.DEFAULT } },
        });

        await waitFor(() => expect(setSentryTags).toHaveBeenCalledWith({ editorVersion: version }));
    });
});
