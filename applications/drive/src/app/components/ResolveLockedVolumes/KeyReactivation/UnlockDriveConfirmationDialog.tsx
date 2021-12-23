import React from 'react';
import {
    Button,
    ButtonLike,
    ContentModal,
    DialogModal,
    FooterModal,
    HeaderModal,
    InnerModal,
    SettingsLink,
} from '@proton/components';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

const appName = getAppName(APPS.PROTONDRIVE);

interface Props {
    onClose?: () => void;
    onBack?: () => void;
    onSubmit?: () => void;
}

const UnlockDriveConfirmationDialog = ({ onClose = noop, onSubmit = noop, onBack, ...rest }: Props) => {
    const modalTitleID = 'UnlockDriveConfirmationDialog';

    return (
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} small {...rest}>
            <HeaderModal hasClose displayTitle noEllipsis modalTitleID={modalTitleID} onClose={onClose}>
                {c('Label').t`Unlock drive`}
            </HeaderModal>
            <ContentModal onReset={onClose} onSubmit={() => onSubmit()}>
                <InnerModal className="mb1">
                    <p>{c('Info').t`Because ${appName} is end-to-end encrypted, we cannot access
                        or decrypt your files for you. To unlock your drive after a password reset,
                        you must have one of the following:`}</p>
                    <ul>
                        <li>{c('Info').t`Your previous password`}</li>
                        <li>{c('Info').t`An active recovery file`}</li>
                        <li>{c('Info').t`Your previous recovery phrase`}</li>
                    </ul>
                    <p>
                        {c('Info').t`If you have one of these, continue to Proton account setting to
                            start the unblock process.`}
                    </p>
                </InnerModal>
                <FooterModal>
                    <Button color="weak" type="button" onClick={onBack}>
                        {c('Action').t`Back`}
                    </Button>
                    <ButtonLike
                        as={SettingsLink}
                        type="submit"
                        color="norm"
                        path="/encryption-keys?action=reactivate#addresses"
                        app={APPS.PROTONMAIL}
                        data-test-id="drive-key-reactivations-options:continue"
                        onClick={onClose}
                    >
                        {c('Action').t`Continue`}
                    </ButtonLike>
                </FooterModal>
            </ContentModal>
        </DialogModal>
    );
};

export default UnlockDriveConfirmationDialog;
