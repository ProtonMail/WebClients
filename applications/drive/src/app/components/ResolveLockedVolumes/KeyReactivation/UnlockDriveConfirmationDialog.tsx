import React from 'react';
import {
    Button,
    ButtonLike,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    SettingsLink,
} from '@proton/components';
import { c } from 'ttag';
import { noop } from '@proton/util/function';
import { APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

const appName = getAppName(APPS.PROTONDRIVE);

interface Props {
    onClose?: () => void;
    onBack?: () => void;
    onSubmit?: () => void;
    open?: boolean;
}

const UnlockDriveConfirmationDialog = ({ onClose = noop, onSubmit = noop, onBack, open }: Props) => {
    return (
        <ModalTwo onClose={onClose} size="small" open={open}>
            <ModalTwoHeader title={c('Label').t`Unlock drive`} />
            <ModalTwoContent onSubmit={() => onSubmit()}>
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" type="button" onClick={onBack}>
                    {c('Action').t`Back`}
                </Button>
                <ButtonLike
                    as={SettingsLink}
                    type="submit"
                    color="norm"
                    path="/encryption-keys?action=reactivate#addresses"
                    app={APPS.PROTONMAIL}
                    data-testid="drive-key-reactivations-options:continue"
                    onClick={onClose}
                >
                    {c('Action').t`Continue`}
                </ButtonLike>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default UnlockDriveConfirmationDialog;
