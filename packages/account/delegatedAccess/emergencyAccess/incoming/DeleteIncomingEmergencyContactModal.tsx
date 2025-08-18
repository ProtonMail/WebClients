import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedIncomingDelegatedAccess } from './interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedIncomingDelegatedAccess;
    onDelete: (value: EnrichedIncomingDelegatedAccess) => void;
    loading: boolean;
}

export const DeleteIncomingEmergencyContactModal = ({ value, loading, onDelete, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedIncomingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Stop being trusted contact?`}
            buttons={[
                <Button
                    color="danger"
                    loading={loading}
                    onClick={() => {
                        onDelete(value);
                    }}
                >
                    {c('Action').t`Opt out`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access').t`This will take effect immediately.`}
            <br />
            <br />
            {c('emergency_access')
                .jt`You will no longer be able to request access to the account of ${user} in case of an emergency.`}
        </Prompt>
    );
};
