import { act } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { getModelState } from '@proton/account/testing/getModelState';
import { parseDOMStringToBodyElement } from '@proton/mail-message/helpers/parseDOMStringToBodyElement';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { addApiMock } from '../../../helpers/tests/api';
import { getCompleteAddress, minimalCache } from '../../../helpers/tests/cache';
import type { GeneratedKey } from '../../../helpers/tests/crypto';
import {
    generateKeys,
    getAddressKeyCache,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/tests/crypto';
import { clearAll } from '../../../helpers/tests/helper';
import { addAttachment } from '../../../store/attachments/attachmentsActions';
import type { DecryptedAttachment } from '../../../store/attachments/attachmentsTypes';
import { AddressID, fromAddress, renderComposer } from './Composer.test.helpers';

loudRejection();

jest.setTimeout(20000);

const victimCID = 'victim@example.com';

const cachedAttachment = (cid: string, cloc: string): DecryptedAttachment => ({
    data: new Uint8Array([1, 2, 3]),
    filename: 'secret.png',
    signatures: [],
    verificationStatus: MAIL_VERIFICATION_STATUS.NOT_SIGNED,
    type: 'image/png',
    cid,
    cloc,
});

// The image deletion watcher is debounced (500ms). Leave it ample time to run, on the fake clock.
const waitForImageDeletionWatcher = () =>
    act(async () => {
        await jest.advanceTimersByTimeAsync(1500);
    });

describe('Composer inline image re-upload', () => {
    let fromKeys: GeneratedKey;
    const address = getCompleteAddress({ ID: AddressID, Email: fromAddress });

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        fromKeys = await generateKeys('me', fromAddress);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    beforeEach(() => {
        jest.useFakeTimers({ advanceTimers: true });
    });

    afterEach(() => {
        jest.useRealTimers();
        clearAll();
    });

    it.each([
        { name: 'cid marker', marker: `<span data-embedded-img="cid:${victimCID}"></span>` },
        { name: 'empty cid marker', marker: '<span data-embedded-img="cid:"></span>' },
        { name: 'rel marker', marker: `<span rel="cid:${victimCID}"></span>` },
    ])('should not upload cached attachments referenced by quoted content ($name)', async ({ marker }) => {
        minimalCache();

        const uploadSpy = jest.fn(() => new Promise(() => {}));
        addApiMock('mail/v4/attachments', uploadSpy, 'post');

        const content = `
            body content
            <blockquote class="protonmail_quote" type="cite">
                quoted content
                ${marker}
            </blockquote>
        `;

        await renderComposer({
            preloadedState: {
                addressKeys: getAddressKeyCache(address, [fromKeys]),
                mailSettings: getModelState({ DraftMIMEType: MIME_TYPES.DEFAULT } as MailSettings),
                addresses: getModelState([address]),
            },
            message: {
                messageDocument: { document: parseDOMStringToBodyElement(content) },
                data: { MIMEType: MIME_TYPES.DEFAULT },
            },
            onStore: (store) => {
                store.dispatch(
                    addAttachment({ ID: 'OtherMessageAttachmentID', attachment: cachedAttachment(victimCID, '') })
                );
                store.dispatch(
                    addAttachment({ ID: 'AnotherMessageAttachmentID', attachment: cachedAttachment('', '') })
                );
            },
        });

        await waitForImageDeletionWatcher();

        expect(uploadSpy).not.toHaveBeenCalled();
    });
});
