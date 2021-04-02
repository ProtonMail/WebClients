import { act } from '@testing-library/react';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { Recipient } from 'proton-shared/lib/interfaces';
import React from 'react';
import { MESSAGE_ACTIONS } from '../constants';
import { addAddressToCache, clearAll, minimalCache, render, tick } from '../helpers/test/helper';
import { OnCompose } from '../hooks/composer/useCompose';
import { MessageExtended } from '../models/message';
import { Breakpoints } from '../models/utils';
import ComposerContainer from './ComposerContainer';
import { preparePlainText } from '../helpers/transforms/transforms';
import { formatFullDate } from '../helpers/date';

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
            initialized: true,
            data: {
                ID,
                MIMEType: 'text/plain' as MIME_TYPES,
                Subject: '',
                Sender,
                ToList: [] as Recipient[],
            },
            decryptedBody: content,
            ...(await preparePlainText(content, false)),
        } as MessageExtended;

        const { findByTestId } = await render(
            <ComposerContainer breakpoints={{} as Breakpoints}>
                {({ onCompose: inputOnCompose }) => {
                    onCompose = inputOnCompose;
                    return null;
                }}
            </ComposerContainer>,
            false
        );

        await act(async () => {
            onCompose({
                action: MESSAGE_ACTIONS.REPLY,
                referenceMessage: message,
            });
        });

        const textarea = (await findByTestId('squire-textarea')) as HTMLTextAreaElement;

        expect(textarea.value).toBe(`

${Signature}

Sent with ProtonMail Secure Email.

‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐

On ${formatFullDate(new Date(0))}, ${Sender.Name} <${Sender.Address}> wrote:

> mail content
> 
> with a link -> https://protonmail.com/`);

        // Wait for Address focus action
        await tick();
    });
});
