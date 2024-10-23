import { c } from 'ttag';

import { Button } from '@proton/atoms';
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
    return (
        <Prompt
            title={c('Title').t`Deny access to user?`}
            buttons={[
                <Button
                    color="danger"
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                >{c('Action').t`Deny access`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <p className="text-break">
                {getBoldFormattedText(
                    c('Info').t`This will deny access to **${email}**. Are you sure you want to continue?`
                )}
            </p>
        </Prompt>
    );
};

export default ConfirmDenyMemberAuthDevice;
