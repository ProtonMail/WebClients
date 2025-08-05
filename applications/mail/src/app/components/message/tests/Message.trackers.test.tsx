import { fireEvent, screen, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/mail/mailSettings';
import { addApiMock } from '@proton/testing/lib/api';
import { mockDefaultBreakpoints } from '@proton/testing/lib/mockUseActiveBreakpoint';
import noop from '@proton/utils/noop';

import { getCompleteAddress, minimalCache } from '../../../helpers/test/cache';
import type { GeneratedKey } from '../../../helpers/test/crypto';
import {
    generateKeys,
    getAddressKeyCache,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import { encryptMessage } from '../../../helpers/test/message';
import { mailTestRender } from '../../../helpers/test/render';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import MessageView from '../MessageView';
import { addressID, labelID, messageID } from './Message.test.helpers';

const trackerName = 'Tracker.com';
const trackerURL = 'https://tracker.com';
const tracker1URL = `${trackerURL}/1`;
const tracker2URL = `${trackerURL}/2`;

const content = `<div>
            <img src={${tracker1URL}} />
            <img src={${tracker2URL}} />
        </div>`;

describe('message trackers', () => {
    const toAddress = 'me@home.net';
    const fromAddress = 'someone@somewhere.net';

    let toKeys: GeneratedKey;
    let fromKeys: GeneratedKey;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', toAddress);
        fromKeys = await generateKeys('someone', fromAddress);

        addApiMock('core/v4/keys/all', () => ({ Address: { Keys: [] } }));
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should display the correct number of trackers before and after load', async () => {
        addApiMock(PROXY_IMG_URL, () => {
            const map = new Map();
            map.set('x-pm-tracker-provider', trackerName);

            return { headers: map };
        });

        minimalCache();

        const encryptedBody = await encryptMessage(content, fromKeys, toKeys);

        const message = {
            ID: messageID,
            AddressID: addressID,
            Subject: 'test',
            Sender: { Name: 'testName', Address: 'testAddress' },
            Attachments: [] as Attachment[],
            Body: encryptedBody,
        } as Message;

        addApiMock(`mail/v4/messages/${messageID}`, () => ({
            Message: message,
        }));

        const mailSettings = {
            HideRemoteImages: SHOW_IMAGES.HIDE,
            ImageProxy: IMAGE_PROXY_FLAGS.PROXY,
        } as MailSettings;

        const props = {
            labelID,
            conversationMode: false,
            loading: false,
            labels: [],
            message: { ID: messageID, AddressID: addressID } as Message,
            mailSettings,
            onBack: jest.fn(),
            breakpoints: mockDefaultBreakpoints,
            onFocus: noop,
            isComposerOpened: false,
            currentFolder: 'INBOX',
        };

        await mailTestRender(<MessageView {...props} />, {
            preloadedState: {
                mailSettings: getModelState(mailSettings),
                addressKeys: getAddressKeyCache(getCompleteAddress({ ID: addressID }), [toKeys]),
            },
            onStore: (store) => {
                store.dispatch(
                    initialize({ data: { ID: messageID, AddressID: addressID } as Message } as MessageState)
                );
            },
        });

        // Check number of trackers before load
        await waitFor(() => {
            const trackersNumberBeforeLoad = screen.getByTestId('privacy:icon-number-of-trackers');
            expect(trackersNumberBeforeLoad.innerHTML).toEqual('2');
        });

        const loadButton = screen.getByTestId('remote-content:load');

        fireEvent.click(loadButton);

        // Check number of trackers after load
        const trackersNumberAfterLoad = screen.queryByTestId('privacy:icon-number-of-trackers');

        expect(trackersNumberAfterLoad?.innerHTML).toEqual('2');
    });
});
