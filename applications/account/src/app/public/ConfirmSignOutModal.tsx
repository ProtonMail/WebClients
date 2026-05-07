import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ConfirmSignOutRecoveryModal from '@proton/components/components/confirmSignOutModal/ConfirmSignOutModal';
import ConfirmSignOutAllModal from '@proton/components/components/confirmSignOutModal/ConfirmSignoutAllModal';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

export interface ConfirmSignoutModalProps extends Omit<ModalProps<'div'>, 'children' | 'buttons' | 'onSubmit'> {
    confirmType: 'single' | 'all' | 'recoveryMessage';
    onSignOut: (clearData: boolean) => void;
}
export const ConfirmSignOutModal = ({ confirmType, onSignOut, ...rest }: ConfirmSignoutModalProps) => {
    return (
        <>
            {confirmType === 'recoveryMessage' && (
                <ConfirmSignOutRecoveryModal
                    onSignOut={(clearData) => {
                        onSignOut(clearData);
                    }}
                    {...rest}
                />
            )}
            {confirmType === 'all' && (
                <ConfirmSignOutAllModal
                    onSignOut={() => {
                        onSignOut(false);
                    }}
                    {...rest}
                />
            )}
            {confirmType === 'single' && (
                <Prompt
                    title={c('Title').t`Sign out`}
                    buttons={[
                        <Button
                            color="norm"
                            onClick={() => {
                                onSignOut(false);
                                rest.onClose?.();
                            }}
                        >
                            {c('Action').t`Sign out`}
                        </Button>,
                        <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                    {...rest}
                >
                    <p>{c('Info').t`Are you sure you want to sign out of this account?`}</p>
                </Prompt>
            )}
        </>
    );
};
