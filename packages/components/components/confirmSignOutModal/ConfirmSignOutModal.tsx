import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { User } from '@proton/shared/lib/interfaces';
import { getHasRecoveryMessage } from '@proton/shared/lib/recoveryFile/deviceRecovery';

import { PrivateAuthenticationStore } from '../../containers';
import { Checkbox } from '../input';
import { Label } from '../label';
import { Prompt, PromptProps } from '../prompt';

export const shouldShowConfirmSignOutModal = ({
    user,
    authentication,
}: {
    user: User;
    authentication: PrivateAuthenticationStore;
}) => {
    const hasEnabledDeviceBasedRecovery = authentication.getTrusted();

    return hasEnabledDeviceBasedRecovery || getHasRecoveryMessage(user.ID);
};

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onSignOut: (clearData: boolean) => void;
}

const ConfirmSignOutModal = ({ onSignOut, onClose, ...rest }: Props) => {
    const [clearData, setClearData] = useState(false);

    return (
        <Prompt
            title={c('Title').t`Sign out`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onSignOut(clearData);
                        onClose?.();
                    }}
                >
                    {c('Action').t`Sign out`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p className="mt-0">
                {c('Info').t`Recovery information will remain on this device unless you select to delete it.`}
            </p>

            <div className="flex flex-row flex-align-items-start">
                <Checkbox
                    id="delete-recovery-storage"
                    className="mt-2 mr-2"
                    checked={clearData}
                    onChange={() => setClearData(!clearData)}
                />
                <div className="flex-item-fluid">
                    <Label htmlFor="delete-recovery-storage" className="block">
                        {c('Label').jt`Delete recovery-related information.`}{' '}
                        <Href href={getKnowledgeBaseUrl('/trusted-device/recovery/')}>{c('Link').t`What’s this?`}</Href>
                    </Label>
                </div>
            </div>
        </Prompt>
    );
};

export default ConfirmSignOutModal;
