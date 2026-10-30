import { fireEvent, screen } from '@testing-library/react';

import { initialize } from '@proton/mail-message/store/messages/read/messagesReadActions';
import {
    MESSAGE_IFRAME_PRINT_CLASS,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
} from '@proton/mail-renderer/constants';
import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { mockUseFlag } from '@proton/unleash/testing/mockUseFlag';

import { addApiKeys } from '../../../helpers/tests/crypto';
import { getIframeRootDiv, setup } from './Message.test.helpers';

describe('Message content', () => {
    describe('plain text', () => {
        it('should not contain print classes and elements', async () => {
            const ID1 = 'ID1';
            const sender1Email = 'sender1@email.com';

            addApiKeys(false, sender1Email, []);

            const message1 = {
                localID: ID1,
                data: {
                    ID: ID1,
                    Body: 'something',
                    MIMEType: MIME_TYPES.PLAINTEXT,
                    Sender: { Name: '', Address: sender1Email },
                } as Message,
                messageDocument: { initialized: true, plainText: 'Body1' },
            };

            const { container } = await setup(message1, { message: message1.data });
            const iframe = await getIframeRootDiv(container);
            const wrapper = document.createElement('div');
            wrapper.appendChild(iframe);

            expect(wrapper.querySelector('.proton-plain-text')).not.toBe(null);
            expect(wrapper.querySelector('.' + MESSAGE_IFRAME_PRINT_CLASS)).toBe(null);
            expect(wrapper.querySelector('#' + MESSAGE_IFRAME_PRINT_HEADER_ID)).toBe(null);
            expect(wrapper.querySelector('#' + MESSAGE_IFRAME_PRINT_FOOTER_ID)).toBe(null);
        });

        it('should escape the content of plain text drafts displayed in the deleted folder', async () => {
            const useFlagSpy = mockUseFlag().mockImplementation((flag) => flag === 'DataRetentionPolicy');

            const ID1 = 'ID1';
            const sender1Email = 'sender1@email.com';
            const plainText = '> <img id="injected" src="x" onerror="alert(1)"> https://proton.me';

            addApiKeys(false, sender1Email, []);

            const message1 = {
                localID: ID1,
                data: {
                    ID: ID1,
                    Body: 'something',
                    ConversationID: 'ConversationID1',
                    Flags: 0,
                    LabelIDs: [MAILBOX_LABEL_IDS.SOFT_DELETED],
                    MIMEType: MIME_TYPES.PLAINTEXT,
                    Sender: { Name: '', Address: sender1Email },
                } as Message,
                messageDocument: { initialized: true, plainText },
            };

            const { container } = await setup(message1, { message: message1.data });
            fireEvent.click(await screen.findByTestId('message-header-collapsed:0'));
            const iframe = await getIframeRootDiv(container);

            expect(iframe.querySelector('#injected')).toBe(null);
            expect(iframe.textContent).toContain('<img id="injected" src="x" onerror="alert(1)">');
            expect(iframe.querySelector('a[href="https://proton.me"]')).not.toBe(null);

            useFlagSpy.mockRestore();
        });

        // Issues displaying dropdown.
        it.skip('should contain print classes and elements', async () => {
            const ID1 = 'ID1';
            const sender1Email = 'sender1@email.com';

            addApiKeys(false, sender1Email, []);

            const message1 = {
                localID: ID1,
                data: {
                    ID: ID1,
                    Body: 'something',
                    MIMEType: MIME_TYPES.PLAINTEXT,
                    Sender: { Name: '', Address: sender1Email },
                } as Message,
                messageDocument: { initialized: true, plainText: 'Body1' },
            };

            const { store } = await setup(message1, { message: message1.data });
            store.dispatch(initialize(message1));
            const moreDropdown = await screen.findByTestId('message-header-expanded:more-dropdown');
            fireEvent.click(moreDropdown);
            const printButton = await screen.findByTestId('message-view-more-dropdown:print');
            fireEvent.click(printButton);
            const printModal = await screen.findByTestId('modal:print-message');
            const iframe = await getIframeRootDiv(printModal.querySelector('iframe') as HTMLIFrameElement);
            const wrapper = document.createElement('div');
            wrapper.appendChild(iframe);

            expect(wrapper.querySelector('.proton-plain-text')).not.toBe(null);
            expect(wrapper.querySelector('.' + MESSAGE_IFRAME_PRINT_CLASS)).not.toBe(null);
            expect(wrapper.querySelector('#' + MESSAGE_IFRAME_PRINT_HEADER_ID)).not.toBe(null);
            expect(wrapper.querySelector('#' + MESSAGE_IFRAME_PRINT_FOOTER_ID)).not.toBe(null);
        });
    });
});
