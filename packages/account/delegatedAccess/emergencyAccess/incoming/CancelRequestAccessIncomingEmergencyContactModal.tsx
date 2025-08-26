import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedIncomingDelegatedAccess } from './interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
    onCancel: (value: EnrichedIncomingDelegatedAccess) => void;
    loading: boolean;
}

export const CancelRequestAccessIncomingEmergencyContactModal = ({ value, loading, onCancel, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedIncomingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Cancel request?`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        onCancel(value);
                    }}
                >
                    {c('Action').t`Cancel request`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>,
            ]}
        >
            {c('emergency_access')
                .jt`You will still be able to request access to the account of ${user} at a later time.`}
        </Prompt>
    );
};
