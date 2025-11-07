import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import type { ModalStateProps } from '@proton/components';
import {
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    SettingsLink,
    useModalTwoStatic,
} from '@proton/components';
import { APPS, BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

interface Props {
    onBack?: () => void;
    onSubmit?: () => void;
}

const UnlockDriveConfirmationDialog = ({ onClose = noop, onSubmit = noop, ...modalProps }: Props & ModalStateProps) => {
    return (
        <ModalTwo onClose={onClose} size="small" {...modalProps}>
            <ModalTwoHeader title={c('Label').t`Unlock drive`} />
            <ModalTwoContent onSubmit={() => onSubmit()}>
                <p>
                    {c('Info')
                        .t`Because ${DRIVE_APP_NAME} is end-to-end encrypted, we cannot access or decrypt your files for you. To unlock your drive after a password reset, you must have one of the following:`}
                </p>
                <ul>
                    <li>{c('Info').t`Your previous password`}</li>
                    <li>{c('Info').t`An active recovery file`}</li>
                    <li>{c('Info').t`Your previous recovery phrase`}</li>
                </ul>
                <p>
                    {c('Info')
                        .t`If you have one of these, continue to ${BRAND_NAME} Account setting to start the unblock process.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" type="button" onClick={onClose}>
                    {c('Action').t`Back`}
                </Button>
                <ButtonLike
                    as={SettingsLink}
                    type="submit"
                    color="norm"
                    path="/recovery"
                    app={APPS.PROTONDRIVE}
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

export const useUnlockDriveConfirmationDialog = () => {
    return useModalTwoStatic(UnlockDriveConfirmationDialog);
};
