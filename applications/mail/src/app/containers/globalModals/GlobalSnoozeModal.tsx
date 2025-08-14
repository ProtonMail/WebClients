import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, Label, Prompt, useModalState } from '@proton/components';
import { setItem } from '@proton/shared/lib/helpers/storage';

import { HIDE_SNOOZE_CONFIRMATION_LS_KEY } from 'proton-mail/components/list/snooze/constant';

import { useMailGlobalModals } from './GlobalModalProvider';
import { ModalType, type SnoozeModalPayload } from './inteface';

export const GlobalSnoozeModal = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [snoozeModalProps, setSnoozeModalProps] = useState<SnoozeModalPayload['value'] | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.Snooze) {
                setOpen(true);
                setSnoozeModalProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe]);

    const handleConfirm = () => {
        if (checked) {
            setItem(HIDE_SNOOZE_CONFIRMATION_LS_KEY, 'true');
        }

        setOpen(false);
        setSnoozeModalProps(null);

        snoozeModalProps?.onConfirm();
    };

    return (
        <>
            {shouldRender && snoozeModalProps && (
                <Prompt
                    title={c('Title').t`Moving a snoozed message`}
                    buttons={[
                        <Button color="norm" onClick={handleConfirm} data-testid="confirm-button">{c('Action')
                            .t`OK`}</Button>,
                        <Button data-testid="cancel-button" onClick={() => setOpen(true)}>{c('Action')
                            .t`Cancel`}</Button>,
                    ]}
                    {...modalProps}
                >
                    {c('Info').t`Snoozing this conversation will be canceled.`}
                    <div className="flex flex-row items-start align-center pt-4">
                        <Checkbox
                            id="snooze-checkbox"
                            checked={checked}
                            onChange={() => setChecked(!checked)}
                            className="mr-2"
                        />
                        <Label htmlFor="snooze-checkbox" className="p-0 flex-1">
                            {c('Label').t`Don't ask again`}
                        </Label>
                    </div>
                </Prompt>
            )}
        </>
    );
};
