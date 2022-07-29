import { c } from 'ttag';

import { AlertModal, Button, ModalProps, PrimaryButton } from '@proton/components';

interface Props extends ModalProps {
    email: string;
    onResolve: () => void;
    onReject: () => void;
}

const SendingFromDefaultAddressModal = ({ email, onResolve, onReject, ...rest }: Props) => {
    return (
        <AlertModal
            title={c('Title').t`Sending notice`}
            buttons={[
                <PrimaryButton onClick={onResolve}>{c('Action').t`OK`}</PrimaryButton>,
                <Button onClick={onReject}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Sending messages from @pm.me address is a paid feature. Your message will be sent from your default address ${email}`}
        </AlertModal>
    );
};

export default SendingFromDefaultAddressModal;
