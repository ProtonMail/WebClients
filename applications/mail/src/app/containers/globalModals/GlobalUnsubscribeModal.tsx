import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Label, Prompt, useApi, useModalState } from '@proton/components';
import { updateSpamAction } from '@proton/shared/lib/api/mailSettings';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import { useMailGlobalModals } from './GlobalModalProvider';
import { ModalType, type UnsubscribeModalPayload } from './inteface';

export const GlobalUnsubscribeModal = () => {
    const api = useApi();
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [unsubscribeModalProps, setUnsubscribeModalProps] = useState<UnsubscribeModalPayload['value'] | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.Unsubscribe) {
                setOpen(true);
                setUnsubscribeModalProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe]);

    const handleConfirm = (spamAction: SPAM_ACTION) => {
        if (checked) {
            void api(updateSpamAction(spamAction));
        }

        unsubscribeModalProps?.onConfirm(spamAction);
    };

    if (!unsubscribeModalProps) {
        return null;
    }

    const elementsCount = unsubscribeModalProps.elementLength;

    return (
        <>
            {shouldRender && (
                <Prompt
                    title={c('Title').t`Move to spam`}
                    buttons={[
                        <Button
                            data-testid="confirm-spam-unsub-button"
                            color="norm"
                            onClick={() => handleConfirm(SPAM_ACTION.SpamAndUnsub)}
                        >{c('Action').t`Move to spam and unsubscribe`}</Button>,
                        <Button onClick={() => handleConfirm(SPAM_ACTION.JustSpam)}>{c('Action')
                            .t`Move to spam`}</Button>,
                        <Button data-testid="cancel-button" onClick={() => setOpen(false)}>{c('Action')
                            .t`Cancel`}</Button>,
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
                        <Checkbox
                            id="remember-me"
                            checked={checked}
                            onChange={() => setChecked(!checked)}
                            className="mr-2"
                        />
                        {c('Label').t`Remember my choice`}
                    </Label>
                </Prompt>
            )}
        </>
    );
};
