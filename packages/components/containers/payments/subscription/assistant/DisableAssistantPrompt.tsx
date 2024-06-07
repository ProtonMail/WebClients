import { format, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalStateProps, Prompt } from '@proton/components/components';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useSubscription } from '@proton/components/hooks';

interface Props extends ModalStateProps {
    onDisable: () => void;
}

const DisableAssistantPrompt = ({ onDisable, ...rest }: Props) => {
    const [subscription] = useSubscription();
    const subscriptionRenewalDate = format(fromUnixTime(subscription?.PeriodEnd ?? 0), 'PP');

    return (
        <Prompt
            title={c('Title').t`Cancel the writing assistant add-on?`}
            buttons={[
                <Button onClick={onDisable}>{c('Action').t`Cancel add-on`}</Button>,
                <Button color="norm" onClick={() => rest.onClose()}>{c('Action')
                    .t`Keep the writing assistant`}</Button>,
            ]}
            {...rest}
        >
            <p>
                {getBoldFormattedText(
                    c('Info')
                        .t`The writing assistant add-on **will not renew**. You can continue to enjoy the service until **${subscriptionRenewalDate}.**`
                )}
            </p>
        </Prompt>
    );
};

export default DisableAssistantPrompt;
