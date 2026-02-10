import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {}

export const RecoveryMethodWarningModal = (rest: Props) => {
    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Remove your recovery contacts to continue`}
            buttons={[<Button onClick={rest.onClose}>{c('Action').t`Got it`}</Button>]}
        >
            {c('emergency_access').t`To disable this recovery method, remove all your recovery contacts.`}
        </Prompt>
    );
};
