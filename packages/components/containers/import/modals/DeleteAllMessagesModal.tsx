import React, { useState } from 'react';
import { c } from 'ttag';

import { Alert, ErrorButton, ConfirmModal, ConfirmModalProps, Input, Row } from '../../../components';

interface Props extends ConfirmModalProps {
    email: string;
}

const DeleteAllMessagesModal = ({ email, ...rest }: Props) => {
    const [phraseInput, setPhraseInput] = useState('');
    const phrase = c('Security phrase').t`Permanently delete messages in ${email}`;
    const upperCasedPhrase = phrase.toUpperCase();

    const domain = email.split('@')[1];
    // translator: this is a segment of a full sentence. The ${email} variable here is the email address messages will be deleted from. For context, the full sentence is "This action will permanently delete all messages on mail@example.com. You will not be able to recover the messages on example.com."
    const boldWarning = (
        <strong key="boldWarning">{c('Warning').t`permanently delete all messages on ${email}`}</strong>
    );
    // translator: The ${boldWarning} variable here is a HTML tag, ${domain} variable is the domain of the email address. The full sentence is "This action will permanently delete all messages on mail@example.com. You will not be able to recover the messages on example.com."
    const instructions = c('Warning')
        .jt`This action will ${boldWarning}. You will not be able to recover the messages on ${domain}.`;

    return (
        <ConfirmModal
            {...rest}
            confirm={
                <ErrorButton disabled={phraseInput !== upperCasedPhrase} type="submit">
                    {c('Action').t`Delete all messages`}
                </ErrorButton>
            }
        >
            <Alert type="error">{instructions}</Alert>

            <div>{c('Instructions').t`To confirm this action enter the following text in the box below.`}</div>

            <div
                className="p1 mt1 mb1 bg-weak text-bold bordered"
                style={{
                    userSelect: 'none',
                    letterSpacing: '-0.2px',
                }}
            >
                {upperCasedPhrase}
            </div>

            <Row>
                <Input
                    value={phraseInput}
                    placeholder={c('Instructions').t`Enter phrase to confirm`}
                    onChange={({ target }) => setPhraseInput(target.value)}
                />
            </Row>
        </ConfirmModal>
    );
};

export default DeleteAllMessagesModal;
