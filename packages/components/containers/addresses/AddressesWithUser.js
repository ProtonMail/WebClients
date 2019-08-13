import React, { useMemo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useApi,
    useEventManager,
    useAddresses,
    Alert,
    OrderableTable,
    OrderableTableHeader,
    OrderableTableBody,
    OrderableTableRow
} from 'react-components';
import { move } from 'proton-shared/lib/helpers/array';
import { orderAddress } from 'proton-shared/lib/api/addresses';

import AddressStatus from './AddressStatus';
import AddressActions from './AddressActions';
import { getStatus } from './helper';
import useNotifications from '../notifications/useNotifications';

const AddressesUser = ({ user }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [addresses, loadingAddresses] = useAddresses();
    const [list, setAddresses] = useState(addresses);
    const member = useMemo(() => ({ Self: 1 }), []);

    useEffect(() => {
        setAddresses(addresses);
    }, [addresses]);

    const handleSortEnd = useCallback(
        async ({ oldIndex, newIndex }) => {
            try {
                const newList = move(list, oldIndex, newIndex);
                const { isDisabled, isDefault } = getStatus({ address: newList[0], i: 0 });

                if (isDisabled && isDefault) {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`A disabled address cannot be primary`
                    });
                    setAddresses(addresses);
                    return;
                }

                setAddresses(newList);
                await api(orderAddress(newList.map(({ ID }) => ID)));
                call();
            } catch (e) {
                setAddresses(addresses);
            }
        },
        [list, addresses]
    );

    if (!loadingAddresses && !addresses.length) {
        return (
            <>
                <Alert>{c('Info').t`No addresses exist`}</Alert>
            </>
        );
    }

    return (
        <OrderableTable onSortEnd={handleSortEnd}>
            <OrderableTableHeader
                cells={[
                    c('Header for addresses table').t`Address`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`
                ]}
            />
            <OrderableTableBody colSpan={3} loading={loadingAddresses}>
                {list &&
                    list.map((address, i) => (
                        <OrderableTableRow
                            index={i}
                            key={address.ID}
                            cells={[
                                <div key={0} className="ellipsis" title={address.Email}>
                                    {address.Email}
                                </div>,
                                <AddressStatus key={1} {...getStatus({ address, i })} />,
                                <AddressActions key={2} member={member} address={address} user={user} />
                            ]}
                        />
                    ))}
            </OrderableTableBody>
        </OrderableTable>
    );
};

AddressesUser.propTypes = {
    user: PropTypes.object.isRequired
};

export default AddressesUser;
