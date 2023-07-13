import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';

import {
    Alert,
    ErrorButton,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../components';

interface Props extends ModalProps {
    email: string;
    onDeleteAddress: () => Promise<void>;
}

const DeleteAddressModal = ({ email, onDeleteAddress, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Delete ${email}`} />
            <ModalTwoContent>
                <Alert className="mb-4" type="info">{c('Info')
                    .t`Please note that if you delete this address, you will no longer be able to send or receive emails using this address.`}</Alert>
                <Alert className="mb-4" type="error">{c('Info')
                    .t`Are you sure you want to delete this address?`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <ErrorButton
                    loading={loading}
                    onClick={() => {
                        withLoading(onDeleteAddress().then(rest.onClose));
                    }}
                >{c('Action').t`Delete`}</ErrorButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteAddressModal;
