import { useState } from 'react';

import { c } from 'ttag';

import { rotateOrganizationKeys } from '@proton/account';
import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Form from '@proton/components/components/form/Form';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { confirmPasswordValidator, passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import type { CachedOrganizationKey } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import {
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    PasswordInputTwo,
    useFormErrors,
    useModalState,
} from '../../components';
import { useErrorHandler, useEventManager, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface Props extends ModalProps {
    hasOtherAdmins: boolean;
    organizationKey: CachedOrganizationKey;
    mode?: 'reset';
}

const ChangeOrganizationKeysModal = ({ onClose, mode, hasOtherAdmins, organizationKey, ...rest }: Props) => {
    const [authModalProps, setAuthModal, renderAuthModal] = useModalState();
    const dispatch = useDispatch();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [config, setConfig] = useState<any>();
    const errorHandler = useErrorHandler();

    const [loading, withLoading] = useLoading();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const title =
        mode === 'reset' ? c('passwordless').t`Reset organization key` : c('passwordless').t`Change organization key`;

    const handleClose = loading ? noop : onClose;

    const handleSubmit = async (password: string) => {
        setConfig(undefined);
        const config = await dispatch(rotateOrganizationKeys({ password }));
        setConfig(config);
        setAuthModal(true);
    };

    return (
        <>
            {renderAuthModal && config && (
                <AuthModal
                    {...authModalProps}
                    config={config}
                    onCancel={() => {
                        setAuthModal(false);
                    }}
                    onExit={() => setConfig(undefined)}
                    onSuccess={async () => {
                        await call();
                        createNotification({ text: c('Success').t`Keys updated` });
                        onClose?.();
                    }}
                />
            )}
            <Modal
                as={Form}
                onSubmit={() => {
                    if (!onFormSubmit()) {
                        return;
                    }

                    void withLoading(handleSubmit(newPassword)).catch(errorHandler);
                }}
                onClose={handleClose}
                {...rest}
            >
                <ModalHeader title={title} />
                <ModalContent>
                    <>
                        {hasOtherAdmins && (
                            <Alert className="mb-4">{c('Info')
                                .t`Other administrators exist in your organization, you are responsible for communicating the new password to them.`}</Alert>
                        )}
                        <Alert className="mb-4" type="warning">
                            {c('Info')
                                .t`Do NOT forget this password. If you forget it, you will not be able to manage your organization.`}
                            <br />
                            {c('Info')
                                .t`Save your password somewhere safe. Click on icon to confirm that you have typed your password correctly.`}
                        </Alert>

                        <InputFieldTwo
                            id="organizationPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`New organization password`}
                            placeholder={c('Placeholder').t`Password`}
                            value={newPassword}
                            onValue={setNewPassword}
                            error={validator([passwordLengthValidator(newPassword)])}
                            autoComplete="new-password"
                            autoFocus
                        />

                        <InputFieldTwo
                            id="confirmPassword"
                            as={PasswordInputTwo}
                            label={c('Label').t`Confirm organization password`}
                            placeholder={c('Placeholder').t`Confirm`}
                            value={confirmPassword}
                            onValue={setConfirmPassword}
                            error={validator([
                                passwordLengthValidator(newPassword),
                                confirmPasswordValidator(newPassword, confirmPassword),
                            ])}
                            autoComplete="new-password"
                        />
                    </>
                </ModalContent>
                <ModalFooter>
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Close`}
                    </Button>
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Change keys`}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};
export default ChangeOrganizationKeysModal;
