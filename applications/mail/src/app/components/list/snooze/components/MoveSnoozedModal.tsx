import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Checkbox, Label, Prompt } from '@proton/components';
import { setItem } from '@proton/shared/lib/helpers/storage';

import { HIDE_SNOOZE_CONFIRMATION_LS_KEY } from '../constant';

interface Props extends ModalProps {
    isMessage: boolean;
    onResolve: () => void;
    onReject: () => void;
    onCloseCustomAction?: () => void;
}

const MoveSnoozedModal = ({ isMessage, onResolve, onReject, onCloseCustomAction, ...rest }: Props) => {
    const [checked, setChecked] = useState(false);

    const handleClose = () => {
        onCloseCustomAction?.();
        onReject();
    };

    const handleConfirm = () => {
        if (checked) {
            setItem(HIDE_SNOOZE_CONFIRMATION_LS_KEY, 'true');
        }

        onResolve();
    };

    return (
        <Prompt
            title={c('Title').t`Moving a snoozed message`}
            buttons={[
                <Button color="norm" onClick={handleConfirm} data-testid="moveSnoozedConvesation">{c('Action')
                    .t`OK`}</Button>,
                <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
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
export default MoveSnoozedModal;
