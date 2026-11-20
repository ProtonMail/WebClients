import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';

import type { ScheduleModalPayload } from './inteface';

interface GlobalScheduleModalProps {
    value: ScheduleModalPayload['value'];
    modalProps: ModalStateProps;
}

export const GlobalScheduleModal = ({ value: scheduleModalProps, modalProps }: GlobalScheduleModalProps) => {
    const handleConfirm = () => {
        modalProps.onClose();

        scheduleModalProps?.onConfirm();
    };

    return (
        <Prompt
            title={c('Title').t`Moving a scheduled message`}
            buttons={[
                <Button color="norm" onClick={() => handleConfirm()} data-testid="confirm-button">{c('Action')
                    .t`OK`}</Button>,
                <Button
                    data-testid="cancel-button"
                    onClick={() => {
                        modalProps.onClose();
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
    );
};
