import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedOutgoingDelegatedAccess } from './interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
    loading: boolean;
    onRevoke: () => void;
}

export const RevokeAccessOutgoingEmergencyContactModal = ({ value, loading, onRevoke, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Revoke access?`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        onRevoke();
                    }}
                >
                    {c('Action').t`Revoke access`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access')
                .jt`${user} will be signed out of your account, and will not be able to access it again until the next emergency access.`}
        </Prompt>
    );
};
