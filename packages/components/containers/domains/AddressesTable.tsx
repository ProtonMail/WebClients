import { useState } from 'react';

import { c } from 'ttag';

import { ADDRESS_RECEIVE, ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { Domain, DomainAddress } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Table, TableBody, TableHeader, TableRow } from '../../components';
import { useEventManager } from '../../hooks';
import AddressCatchAll from './AddressCatchAll';
import DomainAddressStatus from './DomainAddressStatus';

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
                    const { Status, Receive } = address;
                    const isAddressActive =
                        Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === ADDRESS_RECEIVE.RECEIVE_YES;
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <AddressCatchAll
                                    key={key}
                                    disabled={!isAddressActive}
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
                                        void call();
                                    }}
                                />,
                                <div
                                    key={key}
                                    className={clsx('text-ellipsis', !isAddressActive && 'color-disabled')}
                                    title={address.Email}
                                >
                                    {address.Email}
                                </div>,
                                <DomainAddressStatus key={key} address={address} />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default AddressesTable;
