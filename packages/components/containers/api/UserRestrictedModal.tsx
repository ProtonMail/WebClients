import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Modal from '@proton/components/components/modalTwo/Modal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { message as sanitizeMessage } from '@proton/shared/lib/sanitize';

enum Code {
    ForcePasswordChange = 'ChangePassword',
    Force2FA = 'AccountSettingsSetup2FA',
}

interface Action {
    Code: Code;
    Name: string;
    Category: string;
    URL: string;
}

interface Props extends Omit<ModalProps, 'onClose'> {
    message: string | undefined;
    onClose: () => void;
    actions: Action[];
}

const getPath = (code?: Code) => {
    switch (code) {
        case Code.Force2FA:
            return '/account-password#two-fa';
        case Code.ForcePasswordChange:
        default:
            return '/account-password?action=change-password';
    }
};

const getTitle = (code?: Code) => {
    switch (code) {
        case Code.Force2FA:
            return c('Title').t`Account restricted`;
        case Code.ForcePasswordChange:
        default:
            return c('Title').t`Account temporarily locked`;
    }
};

const UserRestrictedModal = ({ message, onClose, onExit, open, actions, ...rest }: Props) => {
    const mainAction = actions.find((action) => action.Category === 'main_action');

    return (
        <Modal open={open} onClose={onClose} onExit={onExit} {...rest}>
            <ModalHeader title={getTitle(mainAction?.Code)} />
            <ModalContent>
                {message && (
                    <div className="mb-4">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeMessage(message) }} />
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                <ButtonLike
                    color="norm"
                    className="ml-auto"
                    as={SettingsLink}
                    path={getPath(mainAction?.Code)}
                    target="_self"
                >
                    {mainAction?.Name ?? c('Action').t`Change password`}
                </ButtonLike>
            </ModalFooter>
        </Modal>
    );
};

export default UserRestrictedModal;
