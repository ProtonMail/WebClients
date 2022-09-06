import { useState } from 'react';

import { c } from 'ttag';

import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';

import { Table, TableBody, TableHeader, TableRow } from '../../components';
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
        <Table className="table-auto">
            <TableHeader
                cells={[
                    <span className="sr-only">{c('Title header for addresses domain table').t`Catch-All`}</span>,
                    c('Title header for addresses domain table').t`Address`,
                    c('Title header for addresses domain table').t`Status`,
                ]}
            />
            <TableBody>
                {addresses.map((address) => {
                    const key = address.ID;
                    return (
                        <TableRow
                            key={key}
                            cells={[
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
                                <div key={key} className="text-ellipsis" title={address.Email}>
                                    {address.Email}
                                </div>,
                                <AddressStatus key={key} address={address} />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default AddressesTable;
