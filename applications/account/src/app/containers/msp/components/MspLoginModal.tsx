import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Prompt, { type PromptProps } from '@proton/components/components/prompt/Prompt';

interface Props extends Omit<PromptProps, 'title' | 'children' | 'buttons'> {
    linkUrl: string;
}

export const MspLoginModal = ({ linkUrl, onClose, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Manage company`}
            buttons={[
                <ButtonLike as="a" color="norm" target="_blank" href={linkUrl} onClick={onClose}>
                    {c('Action').t`Manage company`}
                </ButtonLike>,
                <Button color="weak" onClick={onClose}>
                    {c('Action').t`Close`}
                </Button>,
            ]}
            onClose={onClose}
            {...rest}
        >
            <div>{c('Info').t`You can now access and manage the company as an administrator.`} </div>
        </Prompt>
    );
};
