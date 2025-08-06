import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedOutgoingDelegatedAccess } from './interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
    loading: boolean;
    onGrant: (value: EnrichedOutgoingDelegatedAccess) => void;
}

export const GrantAccessOutgoingEmergencyContactModal = ({ loading, value, onGrant, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Give immediate access?`}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        onGrant(value);
                    }}
                >
                    {c('Action').t`Give access now`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            <p className="mt-0 mb-2">
                {c('emergency_access').jt`${user} will be able to use your account and change your data.`}
            </p>
            <p className="mt-0 mb-2">
                {c('emergency_access')
                    .t`You can remove their access at any time to regain exclusive control of your account.`}
            </p>
        </Prompt>
    );
};
