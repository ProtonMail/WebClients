import React, { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    Checkbox,
    ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalTwo,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

interface Props {
    onClose?: () => void;
    onSubmit: () => Promise<unknown>;
    volumeCount: number;
}

const DeleteLockedVolumesConfirmModal = ({
    onClose = noop,
    onSubmit,
    volumeCount,
    ...modalProps
}: Props & ModalStateProps) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isLoading, withLoading] = useLoading();

    const modalTitle = c('Label').ngettext(msgid`Delete drive?`, `Delete drives?`, volumeCount);

    const warningTitle = c('Label').t`This will permanently delete all files in your locked drive.`;
    const warningInfo = c('Info')
        .t`Note: data may still be available locally on devices where you have installed ${DRIVE_APP_NAME}.`;
    const confirmationText = c('Label').t`Yes, I want to permanently delete my old files`;

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
            size="small"
            as="form"
            disableCloseOnEscape={isLoading}
            onSubmit={handleSubmit}
            {...modalProps}
        >
            <ModalTwoHeader title={modalTitle} />
            <ModalTwoContent>
                <Alert type="warning" className="mb-8">
                    <span>
                        <strong>{warningTitle}</strong>
                    </span>
                </Alert>
                <p>{warningInfo}</p>
                <Checkbox onChange={handleChange}>{confirmationText}</Checkbox>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose}>
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

export const useDeleteLockedVolumesConfirmModal = () => {
    return useModalTwo<Props, void>(DeleteLockedVolumesConfirmModal, false);
};
