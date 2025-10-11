import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';

interface Props extends ModalProps {
    onChange?: () => void;
}

const RecipientsLimitationModal = ({ onChange, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Cannot add more users`}
            buttons={[
                <Button color={'norm'} onClick={onChange}>
                    {c('Action').t`Got it`}
                </Button>,
            ]}
            {...rest}
        >
            <span>{c('Info').t`You've reached the limit of 50 users for this filter. Remove one to add another.`}</span>
        </Prompt>
    );
};

export default RecipientsLimitationModal;
