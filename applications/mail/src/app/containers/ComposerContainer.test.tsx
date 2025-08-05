import { act, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { preparePlainText } from '@proton/mail-renderer/helpers/transforms/transforms';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { FORWARDED_MESSAGE } from '@proton/shared/lib/mail/messages';

import { formatFullDate } from '../helpers/date';
import { clearAll, getCompleteAddress, mailTestRender, minimalCache, tick } from '../helpers/test/helper';
import type { OnCompose } from '../hooks/composer/useCompose';
import { ComposeTypes } from '../hooks/composer/useCompose';
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

        const { unmount } = await mailTestRender(
            <ComposerContainer>
                <Inside />
            </ComposerContainer>,
            {
                preloadedState: {
                    addresses: getModelState([getCompleteAddress({ Email, Signature })]),
                },
            }
        );

        await act(async () => {
            await onCompose({
                type: ComposeTypes.newMessage,
                action: MESSAGE_ACTIONS.REPLY,
                referenceMessage: message,
            });
        });

        const textarea = (await screen.findByTestId('editor-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe(`



${Signature}

Sent with ${protonmailAppName} secure email.

On ${formatFullDate(new Date(0))}, ${Sender.Name} <${Sender.Address}> wrote:

> mail content
> with a link -> https://protonmail.com/`);

        // Wait for Address focus action
        await tick();

        // Unmount unless the container will listen the reset action
        unmount();
    });

    it('should forward to a plaintext message with the right content', async () => {
        let onCompose: OnCompose;

        const content = `mail content
with a link -> https://protonmail.com/`;

        minimalCache();

        const me = { Name: 'me', Address: 'me@protonmail.com' };
        const toRecipient = { Name: 'toRecipient', Address: 'toRecipient@protonmail.com' };
        const ccRecipient = { Name: 'ccRecipient', Address: 'ccRecipient@protonmail.com' };
        const ccRecipient2 = { Name: '', Address: 'ccRecipient2@protonmail.com' };
        const messageSubject = 'Message subject';

        const message = {
            localID: ID,
            data: {
                ID,
                MIMEType: 'text/plain' as MIME_TYPES,
                Subject: messageSubject,
                Sender,
                ToList: [me, toRecipient] as Recipient[],
                CCList: [ccRecipient, ccRecipient2] as Recipient[],
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

        const { unmount } = await mailTestRender(
            <ComposerContainer>
                <Inside />
            </ComposerContainer>,
            {
                preloadedState: {
                    addresses: getModelState([getCompleteAddress({ Email, Signature })]),
                },
            }
        );

        await act(async () => {
            await onCompose({
                type: ComposeTypes.newMessage,
                action: MESSAGE_ACTIONS.FORWARD,
                referenceMessage: message,
            });
        });

        const textarea = (await screen.findByTestId('editor-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe(`



${Signature}

Sent with ${protonmailAppName} secure email.

${FORWARDED_MESSAGE}
From: ${Sender.Name} <${Sender.Address}>
Date: On ${formatFullDate(new Date(0))}
Subject: ${messageSubject}
To: ${me.Name} <${me.Address}>, ${toRecipient.Name} <${toRecipient.Address}>
CC: ${ccRecipient.Name} <${ccRecipient.Address}>, ${ccRecipient2.Address} <${ccRecipient2.Address}>


> mail content
> with a link -> https://protonmail.com/`);

        // Wait for Address focus action
        await tick();

        // Unmount unless the container will listen the reset action
        unmount();
    });
});
