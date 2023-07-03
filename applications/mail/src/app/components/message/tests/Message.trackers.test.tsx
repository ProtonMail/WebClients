import { fireEvent, screen } from '@testing-library/react';

import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { addApiMock } from '@proton/testing/lib/api';
import noop from '@proton/utils/noop';

import { addToCache, minimalCache } from '../../../helpers/test/cache';
import {
    GeneratedKey,
    addKeysToAddressKeysCache,
    generateKeys,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../helpers/test/crypto';
import { encryptMessage } from '../../../helpers/test/message';
import { render } from '../../../helpers/test/render';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { initialize } from '../../../logic/messages/read/messagesReadActions';
import { store } from '../../../logic/store';
import { Breakpoints } from '../../../models/utils';
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
        addKeysToAddressKeysCache(addressID, toKeys);

        addApiMock('core/v4/keys', () => ({}));
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should display the correct number of trackers before and after load', async () => {
        addApiMock(`core/v4/images`, () => {
            const map = new Map();
            map.set('x-pm-tracker-provider', trackerName);

            return { headers: map };
        });

        minimalCache();
        const mailSettings = { HideRemoteImages: SHOW_IMAGES.HIDE, ImageProxy: IMAGE_PROXY_FLAGS.PROXY };
        addToCache('MailSettings', mailSettings);

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

        store.dispatch(initialize({ data: { ID: messageID, AddressID: addressID } as Message } as MessageState));

        const props = {
            labelID,
            conversationMode: false,
            loading: false,
            labels: [],
            message: { ID: messageID, AddressID: addressID } as Message,
            mailSettings: mailSettings as MailSettings,
            onBack: jest.fn(),
            breakpoints: {} as Breakpoints,
            onFocus: noop,
            isComposerOpened: false,
        };

        await render(<MessageView {...props} />, false);

        // Check number of trackers before load
        const trackersNumberBeforeLoad = screen.queryByTestId('privacy:icon-number-of-trackers');

        expect(trackersNumberBeforeLoad?.innerHTML).toEqual('2');

        const loadButton = screen.getByTestId('remote-content:load');

        fireEvent.click(loadButton);

        // Check number of trackers after load
        const trackersNumberAfterLoad = screen.queryByTestId('privacy:icon-number-of-trackers');

        expect(trackersNumberAfterLoad?.innerHTML).toEqual('2');
    });
});
