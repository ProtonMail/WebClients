import { useCallback, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { orderAddresses } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import ConnectGmailButton from '@proton/activation/src/components/SettingsArea/ConnectGmailButton';
import { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '@proton/activation/src/constants';
import useBYOEAddressesCounts from '@proton/activation/src/hooks/useBYOEAddressesCounts';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Alert from '@proton/components/components/alert/Alert';
import { SortableList } from '@proton/components/components/dnd/SortableList';
import { useSortableListItem } from '@proton/components/components/dnd/SortableListItem';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { Handle } from '@proton/components/components/table/Handle';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { usePostSubscriptionTourTelemetry } from '@proton/components/hooks/mail/usePostSubscriptionTourTelemetry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryPostSubscriptionTourEvents } from '@proton/shared/lib/api/telemetry';
import {
    ADDRESS_TYPE,
    APPS,
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, CachedOrganizationKey, Member, UserModel } from '@proton/shared/lib/interfaces';
import { getIsNonDefault, sortAddresses } from '@proton/shared/lib/mail/addresses';
import addressesImg from '@proton/styles/assets/img/illustrations/new-upsells-img/addresses.svg';
import move from '@proton/utils/move';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import ExternalAddressInfo from './ExternalAddressInfo';
import { type AddressPermissions, type AddressStatuses, getPermissions, getStatus } from './helper';

interface Props {
    user: UserModel;
    member?: Member;
    organizationKey?: CachedOrganizationKey;
    hasDescription?: boolean;
    allowAddressDeletion: boolean;
    hasAccessToBYOE?: boolean;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.UNLIMITED_ADDRESSES,
    isSettings: true,
});

const SortableListItem = ({
    address,
    member,
    user,
    addressPermissions,
    addressStatuses,
    index,
    savingIndex,
    allowAddressDeletion,
    onClickEmail,
    onSetDefault,
    disableSort,
}: {
    address: Address;
    index: number;
    savingIndex: number | undefined;
    user: UserModel;
    member: Member | undefined;
    allowAddressDeletion: boolean;
    onClickEmail: (email: string) => void;
    onSetDefault: () => Promise<void>;
    addressPermissions: AddressPermissions;
    addressStatuses: AddressStatuses;
    disableSort?: boolean;
}) => {
    const { isDragging, style, listeners, setNodeRef, attributes } = useSortableListItem({
        id: address.ID,
        disabled: disableSort
            ? {
                  draggable: false,
                  /* droppable allows a nicer UX when dragging another item on top of a disabled item */
                  droppable: true,
              }
            : undefined,
    });

    return (
        <TableRow ref={setNodeRef} style={style} dragging={isDragging}>
            {disableSort ? (
                <TableCell> </TableCell>
            ) : (
                <TableCell {...attributes} {...listeners}>
                    <Handle />
                </TableCell>
            )}
            <TableCell>
                <Tooltip title={address.Email}>
                    <button
                        key={0}
                        type="button"
                        className="user-select text-ellipsis w-auto max-w-full text-left"
                        data-testid="users-and-addresses-table:address"
                        onClick={() => onClickEmail(address.Email)}
                    >
                        <div>{address.Email}</div>
                        <ExternalAddressInfo address={address} />
                    </button>
                </Tooltip>
            </TableCell>
            <TableCell>
                <AddressStatus key={1} {...addressStatuses} />
            </TableCell>
            <TableCell>
                <AddressActions
                    key={2}
                    address={address}
                    member={member}
                    user={user}
                    onSetDefault={onSetDefault}
                    savingIndex={savingIndex}
                    addressIndex={index}
                    permissions={addressPermissions}
                    allowAddressDeletion={allowAddressDeletion}
                />
            </TableCell>
        </TableRow>
    );
};

const AddressesUser = ({
    user,
    organizationKey,
    member,
    hasDescription = true,
    allowAddressDeletion,
    hasAccessToBYOE,
}: Props) => {
    const { createNotification } = useNotifications();
    const [savingIndex, setSavingIndex] = useState<number | undefined>();
    const dispatch = useDispatch();
    const [addresses, loadingAddresses] = useAddresses();
    const [list, setAddresses] = useState<Address[]>(() => sortAddresses(addresses || []));
    const sendTelemetryEvent = usePostSubscriptionTourTelemetry();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();
    const [claimProtonAddressModalProps, setClaimProtonAddressModalOpen, renderClaimProtonAddressModal] =
        useModalState();
    const { byoeAddressesAvailableCount, maxBYOEAddresses } = useBYOEAddressesCounts();

    const isBYOEOnlyAccount = getIsBYOEOnlyAccount(addresses);

    useEffect(() => {
        if (addresses) {
            setAddresses(sortAddresses(addresses));
        }
    }, [addresses]);

    const handleSortEnd = useCallback(
        async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
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
                        createNotification({ type: 'error', text: errorMessage });
                    }
                    setAddresses(sortAddresses(addresses));
                    return;
                }

                setAddresses(newList);
                setSavingIndex(newIndex);

                await dispatch(orderAddresses({ member, addresses: newList }));

                setSavingIndex(undefined);

                if (
                    list.length &&
                    newList.length &&
                    list[0].Type === ADDRESS_TYPE.TYPE_PREMIUM &&
                    newList[0].Type !== ADDRESS_TYPE.TYPE_PREMIUM
                ) {
                    void sendTelemetryEvent({
                        event: TelemetryPostSubscriptionTourEvents.replaced_default_short_domain_address,
                        dimensions: {
                            isForCustomDomain: newList[0].Type === ADDRESS_TYPE.TYPE_CUSTOM_DOMAIN ? 'yes' : 'no',
                        },
                    });
                }
            } catch (e: any) {
                setSavingIndex(undefined);
                setAddresses(sortAddresses(addresses));
            }
        },
        [list, addresses]
    );

    const getSetDefaultAddress = useCallback(
        (addressOldIndex: number) => {
            return async () => {
                await handleSortEnd({ oldIndex: addressOldIndex, newIndex: 0 });
            };
        },
        [handleSortEnd]
    );

    if (!loadingAddresses && !addresses?.length) {
        return <Alert className="mb-4">{c('Info').t`No addresses exist`}</Alert>;
    }

    const handleCopyEmail = (email: string) => {
        textToClipboard(email);
        createNotification({ type: 'success', text: c('Success').t`Email address copied to clipboard` });
    };

    const disabledSortItems = new Set(addresses?.filter((address) => getIsNonDefault(address)).map((item) => item.ID));
    const itemIds = addresses?.map((item) => item.ID).filter((id) => !disabledSortItems.has(id)) ?? [];

    return (
        <>
            {hasDescription && (
                <SettingsParagraph className="mt-2">
                    <span>
                        {c('Info').t`Use the different types of email addresses and aliases offered by ${BRAND_NAME}.`}
                    </span>
                    <br />
                    <Href href={getKnowledgeBaseUrl('/addresses-and-aliases')}>{c('Link').t`Learn more`}</Href>
                </SettingsParagraph>
            )}

            {(!user.hasPaidMail || hasAccessToBYOE) && (
                <div className="mb-4 flex gap-6 self-start items-start">
                    {!user.hasPaidMail && (
                        <>
                            <MailUpsellButton
                                onClick={() => handleUpsellModalDisplay(true)}
                                text={c('Action').t`Get more addresses`}
                            />

                            {isBYOEOnlyAccount && user.isFree && getIsBYOEOnlyAccount(addresses) && (
                                <Button onClick={() => setClaimProtonAddressModalOpen(true)}>
                                    {c('Action').t`Claim ${BRAND_NAME} address`}
                                </Button>
                            )}
                        </>
                    )}

                    {hasAccessToBYOE && (
                        <div>
                            <ConnectGmailButton buttonText={c('loc_nightly: BYOE').t`Connect Gmail address`} />
                            <p className="color-weak text-sm my-2">
                                {c('Label BYOE').ngettext(
                                    msgid`${byoeAddressesAvailableCount} of ${maxBYOEAddresses} email address available`,
                                    `${byoeAddressesAvailableCount} of ${maxBYOEAddresses} email addresses available`,
                                    byoeAddressesAvailableCount
                                )}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Table className="mt-4" hasActions responsive="cards">
                <TableHeader>
                    <tr>
                        <th scope="col" className="w-custom" style={{ '--w-custom': '5%' }}>
                            <IcArrowsCross alt={c('Header for addresses table').t`Drag to reorder`} />
                        </th>
                        <th scope="col">{c('Header for addresses table').t`Address`}</th>
                        <th scope="col">{c('Header for addresses table').t`Status`}</th>
                        <th scope="col">{c('Header for addresses table').t`Actions`}</th>
                    </tr>
                </TableHeader>
                <TableBody colSpan={4} loading={loadingAddresses}>
                    <SortableList onSortEnd={handleSortEnd} items={itemIds}>
                        {list.map((address, index) => {
                            return (
                                <SortableListItem
                                    key={address.ID}
                                    address={address}
                                    user={user}
                                    member={member}
                                    index={index}
                                    onClickEmail={handleCopyEmail}
                                    onSetDefault={getSetDefaultAddress(index)}
                                    savingIndex={savingIndex}
                                    disableSort={disabledSortItems.has(address.ID)}
                                    allowAddressDeletion={allowAddressDeletion}
                                    addressStatuses={getStatus(address, index)}
                                    addressPermissions={getPermissions({
                                        addressIndex: index,
                                        member,
                                        address,
                                        addresses: list,
                                        user,
                                        organizationKey,
                                    })}
                                />
                            );
                        })}
                    </SortableList>
                </TableBody>
            </Table>

            {renderUpsellModal && (
                <UpsellModal
                    title={c('Title').t`An address for each role`}
                    description={c('Description')
                        .t`Keep different parts of your life separate and your inbox organized with additional addresses.`}
                    modalProps={upsellModalProps}
                    illustration={addressesImg}
                    upsellRef={upsellRef}
                />
            )}

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    source={BYOE_CLAIM_PROTON_ADDRESS_SOURCE.ADD_ADDRESS_FREE}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};

export default AddressesUser;
