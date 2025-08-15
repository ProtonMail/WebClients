import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { orderAddresses } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import ConnectGmailButton from '@proton/activation/src/components/SettingsArea/ConnectGmailButton';
import { Href, Tooltip } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import OrderableTable from '@proton/components/components/orderableTable/OrderableTable';
import OrderableTableBody from '@proton/components/components/orderableTable/OrderableTableBody';
import OrderableTableHeader from '@proton/components/components/orderableTable/OrderableTableHeader';
import OrderableTableRow from '@proton/components/components/orderableTable/OrderableTableRow';
import MailUpsellButton from '@proton/components/components/upsell/MailUpsellButton';
import UpsellModal from '@proton/components/components/upsell/UpsellModal/UpsellModal';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import { usePostSubscriptionTourTelemetry } from '@proton/components/hooks/mail/usePostSubscriptionTourTelemetry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryPostSubscriptionTourEvents } from '@proton/shared/lib/api/telemetry';
import {
    ADDRESS_TYPE,
    type APP_NAMES,
    APP_UPSELL_REF_PATH,
    BRAND_NAME,
    MAIL_UPSELL_PATHS,
    UPSELL_COMPONENT,
} from '@proton/shared/lib/constants';
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
import { getPermissions, getStatus } from './helper';

interface Props {
    user: UserModel;
    member?: Member;
    organizationKey?: CachedOrganizationKey;
    hasDescription?: boolean;
    allowAddressDeletion: boolean;
    hasAccessToBYOE?: boolean;
    app?: APP_NAMES;
}

const upsellRef = getUpsellRef({
    app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
    component: UPSELL_COMPONENT.MODAL,
    feature: MAIL_UPSELL_PATHS.UNLIMITED_ADDRESSES,
    isSettings: true,
});

const AddressesUser = ({
    user,
    organizationKey,
    member,
    hasDescription = true,
    allowAddressDeletion,
    hasAccessToBYOE,
    app,
}: Props) => {
    const { createNotification } = useNotifications();
    const [savingIndex, setSavingIndex] = useState<number | undefined>();
    const dispatch = useDispatch();
    const [addresses, loadingAddresses] = useAddresses();
    const [list, setAddresses] = useState<Address[]>(() => sortAddresses(addresses || []));
    const sendTelemetryEvent = usePostSubscriptionTourTelemetry();

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

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

    const setDefaultAddress = useCallback(
        (addressOldIndex: number) => {
            return async () => {
                await handleSortEnd({ oldIndex: addressOldIndex, newIndex: 0 });
            };
        },
        [list, addresses]
    );

    if (!loadingAddresses && !addresses?.length) {
        return <Alert className="mb-4">{c('Info').t`No addresses exist`}</Alert>;
    }

    const handleCopyEmail = (email: string) => {
        textToClipboard(email);
        createNotification({ type: 'success', text: c('Success').t`Email address copied to clipboard` });
    };

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

            {!user.hasPaidMail && (
                <div className="mb-4 flex gap-2 self-start items-center">
                    <MailUpsellButton
                        onClick={() => handleUpsellModalDisplay(true)}
                        text={c('Action').t`Get more addresses`}
                    />

                    {hasAccessToBYOE && (
                        <ConnectGmailButton app={app} buttonText={c('loc_nightly: BYOE').t`Connect Gmail address`} />
                    )}
                </div>
            )}

            <OrderableTable
                onSortEnd={handleSortEnd}
                className="simple-table--has-actions mt-4"
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
                                        <Tooltip title={address.Email}>
                                            <button
                                                key={0}
                                                type="button"
                                                className="user-select text-ellipsis w-auto max-w-full text-left"
                                                data-testid="users-and-addresses-table:address"
                                                onClick={() => handleCopyEmail(address.Email)}
                                            >
                                                {address.Email}
                                            </button>
                                        </Tooltip>,
                                        <AddressStatus key={1} {...addressStatuses} />,
                                        <AddressActions
                                            key={2}
                                            address={address}
                                            member={member}
                                            user={user}
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
                                            allowAddressDeletion={allowAddressDeletion}
                                        />,
                                    ]}
                                />
                            );
                        })}
                </OrderableTableBody>
            </OrderableTable>

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
        </>
    );
};

export default AddressesUser;
