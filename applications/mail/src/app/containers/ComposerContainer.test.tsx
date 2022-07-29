import { act } from '@testing-library/react';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, MIME_TYPES } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';

import { MESSAGE_ACTIONS } from '../constants';
import { formatFullDate } from '../helpers/date';
import { addAddressToCache, clearAll, minimalCache, render, tick } from '../helpers/test/helper';
import { preparePlainText } from '../helpers/transforms/transforms';
import { OnCompose } from '../hooks/composer/useCompose';
import { MessageState } from '../logic/messages/messagesTypes';
import { Breakpoints } from '../models/utils';
import { useOnCompose } from './ComposeProvider';
import ComposerContainer from './ComposerContainer';

const ID = 'ID';
const Email = 'me@test.com';
const Signature = 'Signature';
const Sender = {
    Name: 'sender',
    Address: 'sender@test.com',
};

const protonmailAppName = getAppName(APPS.PROTONMAIL);

describe('ComposerContainer', () => {
    afterEach(clearAll);

    it('should reply to a plaintext message with the right content', async () => {
        let onCompose: OnCompose;

        const content = `mail content
with a link -> https://protonmail.com/`;

        minimalCache();
        addAddressToCache({ Email, Signature });

        const message = {
            localID: ID,
            data: {
                ID,
                MIMEType: 'text/plain' as MIME_TYPES,
                Subject: '',
                Sender,
                ToList: [] as Recipient[],
            },
            decryption: {
                decryptedBody: content,
            },
            messageDocument: {
                initialized: true,
            },
            ...(await preparePlainText(content, false)),
        } as MessageState;

        const Inside = () => {
            onCompose = useOnCompose();
            return null;
        };

        const { findByTestId, unmount } = await render(
            <ComposerContainer breakpoints={{} as Breakpoints}>{() => <Inside />}</ComposerContainer>,
            false
        );

        await act(async () => {
            onCompose({
                action: MESSAGE_ACTIONS.REPLY,
                referenceMessage: message,
            });
        });

        const textarea = (await findByTestId('editor-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe(`



${Signature}

Sent with ${protonmailAppName} secure email.

------- Original Message -------
On ${formatFullDate(new Date(0))}, ${Sender.Name} <${Sender.Address}> wrote:


> mail content
> with a link -> https://protonmail.com/`);

        // Wait for Address focus action
        await tick();

        // Unmount unless the container will listen the reset action
        unmount();
    });
});
