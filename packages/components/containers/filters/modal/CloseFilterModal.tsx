import { c } from 'ttag';
import {
    Alert,
    Button,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../../components';

interface Props extends ModalProps {
    handleDiscard?: () => void;
}

const CloseFilterModal = ({ handleDiscard, ...rest }: Props) => {
    const { onClose } = rest;

    const handleClose = () => {
        handleDiscard?.();
        onClose?.();
    };

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Are you sure you want to close?`} />
            <ModalTwoContent>
                <Alert className="mb1">{c('Info').t`All your changes will be lost.`}</Alert>
                <Alert className="mb1" type="error">{c('Info')
                    .t`Are you sure you want to discard your changes?`}</Alert>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" onClick={handleClose}>{c('Action').t`Discard`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CloseFilterModal;
