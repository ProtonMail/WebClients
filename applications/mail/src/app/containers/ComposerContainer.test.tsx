import { act } from '@testing-library/react';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';
import { addAddressToCache, clearAll, minimalCache, render, tick } from '../helpers/test/helper';
import { OnCompose } from '../hooks/composer/useCompose';
import { Breakpoints } from '../models/utils';
import ComposerContainer from './ComposerContainer';
import { preparePlainText } from '../helpers/transforms/transforms';
import { formatFullDate } from '../helpers/date';
import { MESSAGE_ACTIONS } from '../constants';
import { useOnCompose } from './ComposeProvider';
import { MessageState } from '../logic/messages/messagesTypes';

const ID = 'ID';
const Email = 'me@test.com';
const Signature = 'Signature';
const Sender = {
    Name: 'sender',
    Address: 'sender@test.com',
};

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

Sent with ProtonMail secure email.

------- Original Message -------

On ${formatFullDate(new Date(0))}, ${Sender.Name} <${Sender.Address}> wrote:

> mail content
> 
> with a link -> https://protonmail.com/`);

        // Wait for Address focus action
        await tick();

        // Unmount unless the container will listen the reset action
        unmount();
    });
});
