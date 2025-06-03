import { fireEvent, screen } from '@testing-library/react';

import {
    MESSAGE_IFRAME_PRINT_CLASS,
    MESSAGE_IFRAME_PRINT_FOOTER_ID,
    MESSAGE_IFRAME_PRINT_HEADER_ID,
} from '@proton/mail-renderer/constants';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { addApiKeys } from '../../../helpers/test/crypto';
import { initialize } from '../../../store/messages/read/messagesReadActions';
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
