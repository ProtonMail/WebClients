import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import { setItem } from '@proton/shared/lib/helpers/storage';

import { HIDE_SNOOZE_CONFIRMATION_LS_KEY } from '../../components/list/snooze/constant';
import type { SnoozeModalPayload } from './inteface';

interface GlobalSnoozeModalProps {
    value: SnoozeModalPayload['value'];
    modalProps: ModalStateProps;
}

export const GlobalSnoozeModal = ({ value: snoozeModalProps, modalProps }: GlobalSnoozeModalProps) => {
    const [checked, setChecked] = useState(false);

    const handleConfirm = () => {
        if (checked) {
            setItem(HIDE_SNOOZE_CONFIRMATION_LS_KEY, 'true');
        }

        modalProps.onClose();

        snoozeModalProps.onConfirm();
    };

    return (
        <Prompt
            title={c('Title').t`Moving a snoozed message`}
            buttons={[
                <Button color="norm" onClick={handleConfirm} data-testid="confirm-button">{c('Action').t`OK`}</Button>,
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
    );
};
