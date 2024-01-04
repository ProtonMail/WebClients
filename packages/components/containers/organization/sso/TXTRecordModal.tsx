import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Domain } from '@proton/shared/lib/interfaces';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
} from '../../../components';
import TXTSection from './TXTSection';

interface Props extends ModalProps {
    domain: Domain;
}

const TXTRecordModal = ({ domain, ...rest }: Props) => {
    return (
        <Modal size="large" {...rest}>
            <ModalHeader title={c('Info').t`Verify domain`} />
            <ModalContent>
                <TXTSection domain={domain} includeTimeInformation />
            </ModalContent>
            <ModalFooter className="justify-end">
                <Button color="norm" onClick={rest.onClose}>{c('Action').t`Done`}</Button>
            </ModalFooter>
        </Modal>
    );
};

export default TXTRecordModal;
