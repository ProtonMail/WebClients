import React, { useCallback, useState, useEffect } from 'react';
import { c } from 'ttag';
import { move } from 'proton-shared/lib/helpers/array';
import { orderAddress } from 'proton-shared/lib/api/addresses';
import { Address, CachedOrganizationKey, Member, UserModel } from 'proton-shared/lib/interfaces';
import { ADDRESS_TYPE } from 'proton-shared/lib/constants';

import { Alert, OrderableTable, OrderableTableHeader, OrderableTableBody, OrderableTableRow } from '../../components';
import { useApi, useEventManager, useAddresses, useNotifications } from '../../hooks';

import AddressStatus from './AddressStatus';
import AddressActions from './AddressActions';
import { getStatus } from './helper';

interface Props {
    user: UserModel;
    member?: Member;
    organizationKey?: CachedOrganizationKey;
}

const formatAddresses = (addresses?: Address[]) => {
    if (Array.isArray(addresses)) {
        return addresses.filter(({ Type }) => Type !== ADDRESS_TYPE.TYPE_EXTERNAL);
    }
    return [];
};

const AddressesUser = ({ user, member, organizationKey }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [addresses, loadingAddresses] = useAddresses();
    const [list, setAddresses] = useState<Address[]>(formatAddresses(addresses));

    useEffect(() => {
        setAddresses(formatAddresses(addresses));
    }, [addresses]);

    const handleSortEnd = useCallback(
        async ({ oldIndex, newIndex }) => {
            try {
                const newList = move(list, oldIndex, newIndex);
                const { isDisabled, isDefault } = getStatus(newList[0], 0);

                if (isDisabled && isDefault) {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`A disabled address cannot be primary`,
                    });
                    setAddresses(formatAddresses(addresses));
                    return;
                }

                setAddresses(newList);
                await api(orderAddress(newList.map(({ ID }) => ID)));
                await call();
            } catch (e) {
                setAddresses(formatAddresses(addresses));
            }
        },
        [list, addresses]
    );

    if (!loadingAddresses && !addresses.length) {
        return <Alert>{c('Info').t`No addresses exist`}</Alert>;
    }

    return (
        <>
            <OrderableTable onSortEnd={handleSortEnd} className="simple-table--has-actions">
                <OrderableTableHeader
                    cells={[
                        c('Header for addresses table').t`Address`,
                        c('Header for addresses table').t`Status`,
                        c('Header for addresses table').t`Actions`,
                    ]}
                />
                <OrderableTableBody colSpan={3} loading={loadingAddresses}>
                    {list &&
                        list.map((address, i) => (
                            <OrderableTableRow
                                index={i}
                                key={address.ID}
                                cells={[
                                    <div key={0} className="text-ellipsis" title={address.Email}>
                                        {address.Email}
                                    </div>,
                                    <AddressStatus key={1} {...getStatus(address, i)} />,
                                    <AddressActions
                                        key={2}
                                        address={address}
                                        user={user}
                                        member={member}
                                        organizationKey={organizationKey}
                                    />,
                                ]}
                            />
                        ))}
                </OrderableTableBody>
            </OrderableTable>
        </>
    );
};

export default AddressesUser;
