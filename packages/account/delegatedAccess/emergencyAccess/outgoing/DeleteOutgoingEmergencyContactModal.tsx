import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedOutgoingDelegatedAccess } from './interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
    loading: boolean;
    onRemove: (value: EnrichedOutgoingDelegatedAccess) => void;
}

export const DeleteOutgoingEmergencyContactModal = ({ value, loading, onRemove, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Remove trusted contact`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        onRemove(value);
                    }}
                >
                    {c('Action').t`Remove`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access').t`This will take effect immediately.`}
            <br />
            <br />
            {c('emergency_access')
                .jt`${user} will no longer be able to request access to your account in case of emergency.`}
        </Prompt>
    );
};
