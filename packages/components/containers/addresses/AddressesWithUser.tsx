import { useCallback, useState, useEffect } from 'react';
import { c } from 'ttag';
import { move } from '@proton/shared/lib/helpers/array';
import { orderAddress } from '@proton/shared/lib/api/addresses';
import { Address, CachedOrganizationKey, Member, UserModel } from '@proton/shared/lib/interfaces';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { Alert, OrderableTable, OrderableTableHeader, OrderableTableBody, OrderableTableRow } from '../../components';
import { useApi, useEventManager, useAddresses, useNotifications } from '../../hooks';

import AddressStatus from './AddressStatus';
import AddressActions from './AddressActions';
import { formatAddresses, getPermissions, getStatus } from './helper';

interface Props {
    user: UserModel;
    member?: Member;
    organizationKey?: CachedOrganizationKey;
}

const AddressesUser = ({ user, member, organizationKey }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [savingIndex, setSavingIndex] = useState();
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

                if (isDeepEqual(list, newList)) {
                    return;
                }

                if (isDisabled && isDefault) {
                    createNotification({
                        type: 'error',
                        text: c('Notification').t`A disabled address cannot be primary`,
                    });
                    setAddresses(formatAddresses(addresses));
                    return;
                }

                setAddresses(newList);
                setSavingIndex(newIndex);

                await api(orderAddress(newList.map(({ ID }) => ID)));
                await call();

                setSavingIndex(undefined);
            } catch (e: any) {
                setSavingIndex(undefined);
                setAddresses(formatAddresses(addresses));
            }
        },
        [list, addresses]
    );

    const setDefaultAddress = useCallback(
        (addressOldIndex) => {
            return async () => {
                await handleSortEnd({ oldIndex: addressOldIndex, newIndex: 0 });
            };
        },
        [list, addresses]
    );

    if (!loadingAddresses && !addresses.length) {
        return <Alert className="mb1">{c('Info').t`No addresses exist`}</Alert>;
    }

    return (
        <>
            <OrderableTable
                onSortEnd={handleSortEnd}
                className="simple-table--has-actions"
                helperClassname="simple-table--has-actions"
            >
                <OrderableTableHeader
                    cells={[
                        c('Header for addresses table').t`Address`,
                        c('Header for addresses table').t`Status`,
                        c('Header for addresses table').t`Actions`,
                    ]}
                />
                <OrderableTableBody colSpan={3} loading={loadingAddresses}>
                    {list &&
                        list.map((address, i) => {
                            const addressStatuses = getStatus(address, i);
                            return (
                                <OrderableTableRow
                                    disableSort={addressStatuses.isDisabled}
                                    key={i}
                                    index={i}
                                    cells={[
                                        <div key={0} className="text-ellipsis" title={address.Email}>
                                            {address.Email}
                                        </div>,
                                        <AddressStatus key={1} {...addressStatuses} />,
                                        <AddressActions
                                            key={2}
                                            address={address}
                                            member={member}
                                            organizationKey={organizationKey}
                                            onSetDefault={setDefaultAddress(i)}
                                            savingIndex={savingIndex}
                                            addressIndex={i}
                                            permissions={getPermissions({
                                                addressIndex: i,
                                                member,
                                                address,
                                                addresses: list,
                                                user,
                                                organizationKey,
                                            })}
                                        />,
                                    ]}
                                />
                            );
                        })}
                </OrderableTableBody>
            </OrderableTable>
        </>
    );
};

export default AddressesUser;
