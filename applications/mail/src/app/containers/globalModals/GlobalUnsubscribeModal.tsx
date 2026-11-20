import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import type { UnsubscribeModalPayload } from './inteface';

interface GlobalUnsubscribeModalProps {
    value: UnsubscribeModalPayload['value'];
    modalProps: ModalStateProps;
}

export const GlobalUnsubscribeModal = ({ value: unsubscribeModalProps, modalProps }: GlobalUnsubscribeModalProps) => {
    const { update } = useUpdateMailSetting();
    const [checked, setChecked] = useState(false);

    const handleConfirm = (spamAction: SPAM_ACTION) => {
        if (checked) {
            update('SpamAction', spamAction, { notify: false });
        }

        modalProps.onClose();

        unsubscribeModalProps.onConfirm(spamAction);
    };

    const elementsCount = unsubscribeModalProps.elementLength;

    return (
        <Prompt
            title={c('Title').t`Move to spam`}
            buttons={[
                <Button
                    data-testid="confirm-spam-unsub-button"
                    color="norm"
                    onClick={() => handleConfirm(SPAM_ACTION.SpamAndUnsub)}
                >{c('Action').t`Move to spam and unsubscribe`}</Button>,
                <Button onClick={() => handleConfirm(SPAM_ACTION.JustSpam)}>{c('Action').t`Move to spam`}</Button>,
                <Button
                    data-testid="cancel-button"
                    onClick={() => {
                        setChecked(false);
                        modalProps.onClose();
                    }}
                >{c('Action').t`Cancel`}</Button>,
            ]}
            {...modalProps}
        >
            <p className="mb-8">
                {unsubscribeModalProps.isMessage
                    ? c('Info').ngettext(
                          msgid`This message will be marked as spam. Would you also like to unsubscribe from future emails?`,
                          `These messages will be marked as spam. Would you also like to unsubscribe from future emails?`,
                          elementsCount
                      )
                    : c('Info').ngettext(
                          msgid`This conversation will be marked as spam. Would you also like to unsubscribe from future emails?`,
                          `These conversations will be marked as spam. Would you also like to unsubscribe from future emails?`,
                          elementsCount
                      )}
            </p>
            <Label htmlFor="remember-me" className="inline-flex w-auto">
                <Checkbox id="remember-me" checked={checked} onChange={() => setChecked(!checked)} className="mr-2" />
                {c('Label').t`Remember my choice`}
            </Label>
        </Prompt>
    );
};
