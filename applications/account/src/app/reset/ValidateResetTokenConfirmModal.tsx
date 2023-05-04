import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';

interface ModalProps {
    onClose: () => void;
    onConfirm: () => void;
    recoveryMethods: RecoveryMethod[];
    open: boolean;
    address?: string;
}

const ValidateResetTokenConfirmModal = ({ onClose, onConfirm, open, address, recoveryMethods }: ModalProps) => {
    const oldPassword = (
        <span className="text-bold" key="lose-access">{
            // translator: full sentence "Your existing messages, calendars, or contacts will be locked. To recover this data, you’ll need your recovery phrase or your old password."
            c('Info').t`old password`
        }</span>
    );

    const twoFa = (
        <span className="text-bold" key="lose-access">{
            // translator: full sentence "Any two-factor authentication (2FA) method on your account will be disabled."
            c('Info').t`two-factor authentication (2FA)`
        }</span>
    );

    return (
        <ModalTwo open={open} onClose={onClose}>
            <ModalTwoHeader title={c('Title').t`Reset password?`} subline={address} />
            <ModalTwoContent>
                <div>{c('Info').jt`Once you reset your password:`}</div>
                <ul>
                    <li className="mb-2">
                        {(() => {
                            if (recoveryMethods.includes('mnemonic')) {
                                // translator: full sentence "Your existing messages, calendars, or contacts will be locked. To recover this data, you’ll need your recovery phrase or your old password."
                                return c('Info')
                                    .jt`Your existing messages, calendars, or contacts will be locked. To recover this data, you’ll need your recovery phrase or your ${oldPassword}.`;
                            }

                            // translator: full sentence "Your existing messages, calendars, or contacts will be locked. To recover this data, you’ll need your old password."
                            return c('Info')
                                .jt`Your existing messages, calendars, or contacts will be locked. To recover this data, you’ll need your ${oldPassword}.`;
                        })()}
                    </li>
                    <li>
                        {
                            // translator: full sentence "Any two-factor authentication (2FA) method on your account will be disabled."
                            c('Info').jt`Any ${twoFa} method on your account will be disabled.`
                        }
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
