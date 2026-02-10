import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedOutgoingDelegatedAccess } from '../../../shared/outgoing/interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
    onProceed: () => void;
}

export const RetryWarningRecoverOutgoingRecoveryContactModal = ({ value, onProceed, ...rest }: Props) => {
    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Unable to recover data`}
            buttons={[
                <Button color="norm" onClick={onProceed}>
                    {c('emergency_access').t`Proceed anyway`}
                </Button>,
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
        >
            {c('emergency_access').jt`We were not able to verify the recovery data. Proceed anyway?`}
        </Prompt>
    );
};
