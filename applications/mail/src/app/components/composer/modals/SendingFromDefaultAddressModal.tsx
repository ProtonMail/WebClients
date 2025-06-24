import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';

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
                <Button color="norm" onClick={onResolve}>{c('Action').t`OK`}</Button>,
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
