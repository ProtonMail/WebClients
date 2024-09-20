import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Info from '@proton/components/components/link/Info';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import AddressesTable from './AddressesTable';

interface Props extends ModalProps {
    domain: Domain;
    domainAddresses: DomainAddress[];
}

const CatchAllModal = ({ domain, domainAddresses, ...rest }: Props) => {
    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader
                title={
                    <span className="inline-flex items-center">
                        {c('Title').t`Catch-All address`}
                        <Info buttonClass="ml-2" url={getKnowledgeBaseUrl('/catch-all')} />
                    </span>
                }
            />
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
