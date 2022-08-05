import { useState } from 'react';

import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { Info, Table, TableBody, TableHeader, TableRow } from '../../components';
import { useEventManager } from '../../hooks';
import AddressCatchAll from './AddressCatchAll';
import AddressStatus from './AddressStatus';

interface Props {
    domain: Domain;
    domainAddresses: DomainAddress[];
}

const AddressesTable = ({ domain, domainAddresses }: Props) => {
    const { call } = useEventManager();
    const [addresses, setAddresses] = useState(() => domainAddresses);

    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for addresses domain table').t`Address`,
                    c('Title header for addresses domain table').t`Status`,
                    <span className="inline-flex flex-align-items-center">
                        {c('Title header for addresses domain table').t`Catch-All`}
                        <Info className="ml0-5" url={getKnowledgeBaseUrl('/catch-all')} />
                    </span>,
                ]}
            />
            <TableBody colSpan={4}>
                {addresses.map((address) => {
                    const key = address.ID;
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <div key={key} className="text-ellipsis" title={address.Email}>
                                    {address.Email}
                                </div>,
                                <AddressStatus key={key} address={address} />,
                                <AddressCatchAll
                                    key={key}
                                    address={address}
                                    domain={domain}
                                    onChange={(id, value) => {
                                        const newValue = value ? 1 : 0;
                                        setAddresses(
                                            addresses.map((address) => {
                                                return {
                                                    ...address,
                                                    CatchAll: address.ID === id ? newValue : 0,
                                                } as const;
                                            })
                                        );
                                        call();
                                    }}
                                />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default AddressesTable;
