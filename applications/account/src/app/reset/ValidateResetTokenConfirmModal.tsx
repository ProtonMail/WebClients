import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { RecoveryMethod } from '@proton/components/containers/resetPassword/interface';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface ModalProps {
    onClose: () => void;
    onConfirm: () => void;
    recoveryMethods: RecoveryMethod[];
    open: boolean;
    address?: string;
    hasRecoveryFile: boolean;
}

const ValidateResetTokenConfirmModal = ({
    onClose,
    onConfirm,
    open,
    address,
    recoveryMethods,
    hasRecoveryFile,
}: ModalProps) => {
    const deviceLink = (
        <Href key="learn-more" href={getKnowledgeBaseUrl('/device-data-recovery')}>
            {c('Info').t`trusted device`}
        </Href>
    );
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
                {hasRecoveryFile && (
                    <div className="p-3 border border-weak rounded">
                        <div className="flex flex-nowrap gap-2">
                            <div className="flex shrink-0 mt-0.5">
                                <IcCheckmarkCircleFilled className="color-success" />
                            </div>
                            <div>
                                <div className="mb-1">
                                    <b>{c('Info').t`Data recoverable on this device`}</b>
                                </div>
                                {c('Info')
                                    .jt`We stored a backup file in this browser because you allowed data recovery on this ${deviceLink}. If the backup file is valid, you will immediately regain complete or partial access to your encrypted data.`}
                            </div>
                        </div>
                    </div>
                )}
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
