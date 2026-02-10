import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

import type { EnrichedOutgoingDelegatedAccess } from '../../../shared/outgoing/interface';

interface Props extends Omit<PromptProps, 'children' | 'buttons'> {
    value: EnrichedOutgoingDelegatedAccess;
}

export const RecoverOutgoingRecoveryContactModal = ({ value, ...rest }: Props) => {
    const user = (
        <span key="user" className="text-bold text-break">
            {value.parsedOutgoingDelegatedAccess.contact.formatted}
        </span>
    );

    return (
        <Prompt
            {...rest}
            title={c('emergency_access').t`Recovery request sent`}
            buttons={[
                <Button color="norm" onClick={rest.onClose}>
                    {c('Action').t`Done`}
                </Button>,
            ]}
        >
            {c('emergency_access').jt`Let ${user} know it’s really you trying to regain access.`}
            <br />
            <br />
            {c('emergency_access')
                .jt`Have them check their inbox for an email asking for their help to recover your data. The email contains a link they need to click to verify your request.`}
        </Prompt>
    );
};
