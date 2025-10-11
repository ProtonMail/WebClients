import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

interface Props extends Omit<PromptProps, 'title' | 'buttons' | 'children'> {
    onSignOut: () => void;
}

const ConfirmSignOutAllModal = ({ onSignOut, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Are you sure?`}
            buttons={[
                <Button
                    color="norm"
                    onClick={() => {
                        onSignOut();
                        rest.onClose?.();
                    }}
                >{c('Action').t`Continue`}</Button>,
                <Button onClick={() => rest.onClose?.()}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <p>{c('Info').t`This will sign you out of all accounts currently logged in.`}</p>
        </Prompt>
    );
};

export default ConfirmSignOutAllModal;
