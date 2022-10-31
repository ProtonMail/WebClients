import React, { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    Checkbox,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useLoading,
} from '@proton/components';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

const appName = getAppName(APPS.PROTONDRIVE);

interface Props {
    onClose?: () => void;
    onBack?: () => void;
    onSubmit: () => Promise<unknown>;
    volumeCount: number;
    open?: boolean;
}

const DeleteLockedVolumesConfirmModal = ({ onClose = noop, onSubmit, onBack, volumeCount, open }: Props) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, withLoading] = useLoading();

    const modalTitle = c('Label').ngettext(msgid`Delete drive?`, `Delete drives?`, volumeCount);

    const warningTitle = c('Label').t`This will permanently delete all files in your locked drive.`;
    const warningInfo = c('Info')
        .t`Note: Data may still be available locally on devices where you have installed ${appName}.`;
    const confirmationText = c('Label').t`Yes, I want to permanently delete
        my old files`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(e.target.checked);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        return withLoading(onSubmit());
    };
    return (
        <ModalTwo
            onClose={onClose}
            open={open}
            size="small"
            as="form"
            disableCloseOnEscape={isLoading}
            onSubmit={handleSubmit}
        >
            <ModalTwoHeader title={modalTitle} />
            <ModalTwoContent>
                <Alert type="warning" className="mb2">
                    <span>
                        <strong>{warningTitle}</strong>
                    </span>
                </Alert>
                <p>{warningInfo}</p>
                <Checkbox onChange={handleChange}>{confirmationText}</Checkbox>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onBack}>
                    {c('Action').t`Back`}
                </Button>
                <Button color="danger" type="submit" disabled={!isChecked} loading={isLoading}>
                    {c('Action').t`Delete`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteLockedVolumesConfirmModal;
