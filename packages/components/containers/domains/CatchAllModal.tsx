import { c } from 'ttag';

import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { Button, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
import AddressesTable from './AddressesTable';

interface Props extends ModalProps {
    domain: Domain;
    domainAddresses: DomainAddress[];
}

const CatchAllModal = ({ domain, domainAddresses, ...rest }: Props) => {
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader title={c('Title').t`Catch-All address`} />
            <ModalTwoContent>
                <AddressesTable domain={domain} domainAddresses={domainAddresses} />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CatchAllModal;
