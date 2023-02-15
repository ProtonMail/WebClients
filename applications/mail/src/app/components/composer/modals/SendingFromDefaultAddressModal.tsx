import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, PrimaryButton, Prompt } from '@proton/components';

interface Props extends ModalProps {
    email: string;
    onResolve: () => void;
    onReject: () => void;
}

const SendingFromDefaultAddressModal = ({ email, onResolve, onReject, ...rest }: Props) => {
    return (
        <Prompt
            title={c('Title').t`Sending notice`}
            buttons={[
                <PrimaryButton onClick={onResolve}>{c('Action').t`OK`}</PrimaryButton>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Sending messages from @pm.me address is a paid feature. Your message will be sent from your default address ${email}`}
        </Prompt>
    );
};

export default SendingFromDefaultAddressModal;
