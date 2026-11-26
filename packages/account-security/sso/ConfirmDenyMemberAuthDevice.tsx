import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';

import type { PendingAdminActivation } from './memberAuthDevices';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onConfirm: () => void;
    pendingMemberAuthDevice: PendingAdminActivation;
}

const ConfirmDenyMemberAuthDevice = ({ onClose, onConfirm, pendingMemberAuthDevice, ...rest }: Props) => {
    const email = pendingMemberAuthDevice.member.Name;
    const isPasswordReset = pendingMemberAuthDevice.memberAuthDevice.IsRecovery;
    return (
        <Prompt
            title={isPasswordReset ? c('Title').t`Deny password reset?` : c('Title').t`Deny access to user?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >
                    {isPasswordReset ? c('Action').t`Deny` : c('Action').t`Deny access`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <p className="text-break">
                {getBoldFormattedText(
                    isPasswordReset
                        ? c('Info')
                              .t`**${email}** won't be able to reset their password with this request. Are you sure?`
                        : c('Info').t`This will deny access to **${email}**. Are you sure you want to continue?`
                )}
            </p>
        </Prompt>
    );
};

export default ConfirmDenyMemberAuthDevice;
