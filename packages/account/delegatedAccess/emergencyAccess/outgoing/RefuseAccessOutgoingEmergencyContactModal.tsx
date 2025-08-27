import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedOutgoingDelegatedAccess } from './interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
    loading: boolean;
    onRefuse: () => void;
}

export const RefuseAccessOutgoingEmergencyContactModal = ({ value, loading, onRefuse, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Refuse access?`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        onRefuse();
                    }}
                >
                    {c('Action').t`Refuse access`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access').jt`${user} will not be able to access your account until the next emergency access.`}
        </Prompt>
    );
};
