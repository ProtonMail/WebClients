import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { PromptProps } from '@proton/components/components/prompt/Prompt';
import Prompt from '@proton/components/components/prompt/Prompt';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoading from '@proton/hooks/useLoading';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onResend: () => Promise<void>;
    email: string;
}

const ResendInvitePrompt = ({ onClose, onResend, email, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <Prompt
            title={c('Title').t`Send new invite?`}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    onClick={() => {
                        withLoading(onResend()).then(onClose);
                    }}
                >{c('Action').t`Send new invite`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p className="text-break">
                {getBoldFormattedText(c('Info').t`This will send a new invite to **${email}**.`)}
            </p>
        </Prompt>
    );
};

export default ResendInvitePrompt;
