import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt, useModalState } from '@proton/components';

import { useMailGlobalModals } from './GlobalModalProvider';
import { ModalType, type ScheduleModalPayload } from './inteface';

export const GlobalScheduleModal = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [scheduleModalProps, setScheduleModalProps] = useState<ScheduleModalPayload['value'] | null>(null);

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.Schedule) {
                setOpen(true);
                setScheduleModalProps(payload.value);
            }
        });
        return unsubscribe;
    }, [subscribe]);

    return (
        <>
            {shouldRender && scheduleModalProps && (
                <Prompt
                    title={c('Title').t`Moving a scheduled message`}
                    buttons={[
                        <Button color="norm" onClick={scheduleModalProps.onConfirm} data-testid="confirm-button">{c(
                            'Action'
                        ).t`OK`}</Button>,
                        <Button
                            data-testid="cancel-button"
                            onClick={() => {
                                setOpen(false);
                            }}
                        >{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...modalProps}
                >
                    {scheduleModalProps.isMessage
                        ? c('Info').t`Scheduled send of this message will be canceled.`
                        : c('Info')
                              .t`This conversation contains a scheduled message. Sending of this message will be canceled.`}
                </Prompt>
            )}
        </>
    );
};
