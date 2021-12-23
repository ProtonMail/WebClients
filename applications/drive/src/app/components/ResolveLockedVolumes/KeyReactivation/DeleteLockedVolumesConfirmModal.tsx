import React, { useState } from 'react';
import { c, msgid } from 'ttag';

import {
    Alert,
    Button,
    Checkbox,
    ContentModal,
    DialogModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    useLoading,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

const appName = getAppName(APPS.PROTONDRIVE);

interface Props {
    onClose?: () => void;
    onBack?: () => void;
    onSubmit: () => Promise<unknown>;
    volumeCount: number;
}

const DeleteLockedVolumesConfirmModal = ({ onClose = noop, onSubmit, onBack, volumeCount, ...rest }: Props) => {
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

    const modalTitleID = 'DeleteOldFilesConfirmModal';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small disableCloseOnOnEscape={isLoading} {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {modalTitle}
            </HeaderModal>
            <ContentModal onReset={onClose} onSubmit={() => withLoading(onSubmit())}>
                <InnerModal className="mb1">
                    <Alert type="warning" className="mb2">
                        <span>
                            <strong>{warningTitle}</strong>
                        </span>
                    </Alert>
                    <p>{warningInfo}</p>
                    <Checkbox onChange={handleChange}>{confirmationText}</Checkbox>
                </InnerModal>
                <FooterModal>
                    <Button color="weak" type="button" onClick={onBack}>
                        {c('Action').t`Back`}
                    </Button>
                    <Button color="danger" type="submit" disabled={!isChecked || isLoading}>
                        {c('Action').t`Delete`}
                    </Button>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default DeleteLockedVolumesConfirmModal;
