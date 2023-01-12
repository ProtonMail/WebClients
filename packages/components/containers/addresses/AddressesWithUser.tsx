import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { orderAddress } from '@proton/shared/lib/api/addresses';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { Address, CachedOrganizationKey, Member, UserModel } from '@proton/shared/lib/interfaces';
import move from '@proton/utils/move';

import { Alert, OrderableTable, OrderableTableBody, OrderableTableHeader, OrderableTableRow } from '../../components';
import { useAddresses, useApi, useEventManager, useNotifications } from '../../hooks';
import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import { formatAddresses, getIsNonDefault, getPermissions, getStatus } from './helper';

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
                const { isExternal, isDisabled } = getStatus(newList[0], 0);

                if (isDeepEqual(list, newList)) {
                    return;
                }

                if (newIndex === 0 && (isDisabled || isExternal)) {
                    const errorMessage = (() => {
                        if (isDisabled) {
                            return c('Notification').t`A disabled address cannot be default`;
                        }
                        if (isExternal) {
                            return c('Notification').t`An external address cannot be default`;
                        }
                    })();
                    if (errorMessage) {
                        createNotification({
                            type: 'error',
                            text: errorMessage,
                        });
                    }
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
                                    disableSort={getIsNonDefault(address)}
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
