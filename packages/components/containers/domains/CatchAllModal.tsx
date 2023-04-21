import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { Info, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../components';
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
                    <span className="inline-flex flex-align-items-center">
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
