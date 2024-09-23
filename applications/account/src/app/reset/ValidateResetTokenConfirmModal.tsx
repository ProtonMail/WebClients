import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

interface ModalProps {
    onClose: () => void;
    onConfirm: () => void;
    recoveryMethods: RecoveryMethod[];
    open: boolean;
    address?: string;
}

const ValidateResetTokenConfirmModal = ({ onClose, onConfirm, open, address, recoveryMethods }: ModalProps) => {
    return (
        <ModalTwo open={open} onClose={onClose} size="small">
            <ModalTwoHeader title={c('Title').t`Reset password?`} subline={address} />
            <ModalTwoContent>
                <div>{c('Info').t`Once you reset your password:`}</div>
                <ul>
                    <li>
                        {(() => {
                            if (recoveryMethods.includes('mnemonic')) {
                                return getBoldFormattedText(
                                    c('password_reset: info')
                                        .t`**All your existing data** (emails, events, contacts, files, ${PASS_APP_NAME} entries, etc.) **will be locked** and can only be unlocked with your **recovery phrase** or your **old password**.`
                                );
                            }

                            return getBoldFormattedText(
                                c('password_reset: info')
                                    .t`**All your existing data** (emails, events, contacts, files, ${PASS_APP_NAME} entries, etc.) **will be locked** and can only be unlocked with your **old password**.`
                            );
                        })()}
                    </li>
                    <li>
                        {getBoldFormattedText(
                            c('password_reset: info')
                                .t`Any **two-factor authentication (2FA)** method on your account will be disabled.`
                        )}
                    </li>
                </ul>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    color="danger"
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                >
                    {c('Action').t`Reset password`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ValidateResetTokenConfirmModal;
