import { c } from 'ttag';

import { Alert, Button, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import { useLoading } from '../../hooks';

interface Props extends ModalProps {
    email: string;
    onDisable: () => Promise<void>;
}

const DisableAddressModal = ({ email, onDisable, ...rest }: Props) => {
    const [loading, withLoading] = useLoading();
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Disable ${email}`} />
            <ModalTwoContent>
                <Alert className="mb1" type="warning">{c('Warning')
                    .t`By disabling this address, you will no longer be able to send or receive emails using this address and all the linked Proton products will also be disabled. Are you sure you want to disable this address?`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" onClick={() => withLoading(onDisable().then(rest.onClose))} loading={loading}>{c(
                    'Action'
                ).t`Confirm`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DisableAddressModal;
