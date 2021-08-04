import { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow, Info } from '../../components';
import { useEventManager } from '../../hooks';

import AddressStatus from './AddressStatus';
import AddressCatchAll from './AddressCatchAll';

const AddressesTable = ({ domain, domainAddresses }) => {
    const { call } = useEventManager();
    const [addresses, setAddresses] = useState(() => domainAddresses);

    const handleChange =
        ({ ID }) =>
        async (newValue) => {
            setAddresses(
                addresses.map((address) => {
                    return {
                        ...address,
                        CatchAll: address.ID === ID ? +newValue : 0,
                    };
                })
            );
            await call();
        };

    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title header for addresses domain table').t`Address`,
                    c('Title header for addresses domain table').t`Status`,
                    <span className="inline-flex flex-align-items-center">
                        {c('Title header for addresses domain table').t`Catch-All`}
                        <Info className="ml0-5" url="https://protonmail.com/support/knowledge-base/catch-all/" />
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
                                    onChange={handleChange(address)}
                                />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

AddressesTable.propTypes = {
    domain: PropTypes.object.isRequired,
    domainAddresses: PropTypes.array.isRequired,
};

export default AddressesTable;
