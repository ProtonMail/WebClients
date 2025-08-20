import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { ButtonLike, InlineLinkButton, Tooltip } from '@proton/atoms';
import { Dropdown, DropdownMenuButton, Icon, useModalState, usePopperAnchor } from '@proton/components';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import useNotifications from '@proton/components/hooks/useNotifications';
import { ADDRESS_TYPE, APPS, BRAND_NAME, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { getIsAddressActive, getIsBYOEAddress, getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import type { Address } from '@proton/shared/lib/interfaces';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';
import generateUID from '@proton/utils/generateUID';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const ToolbarAddressesDropdown = ({ labelID, selectedIDs }: Props) => {
    const [addresses] = useAddresses();
    const { createNotification } = useNotifications();
    const [uid] = useState(generateUID('dropdown'));

    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const internalAndBYOEAddresses = useMemo(() => {
        const filteredAddresses =
            addresses?.filter((address) => {
                return (
                    getIsAddressActive(address) &&
                    !(address?.Type === ADDRESS_TYPE.TYPE_EXTERNAL && !getIsBYOEAddress(address))
                );
            }) || [];

        // Show BYOE addresses at the top of the list
        return filteredAddresses.sort((a, b) => {
            return Number(getIsBYOEAddress(b)) - Number(getIsBYOEAddress(a));
        });
    }, [addresses]);
    const numberOfAddresses = internalAndBYOEAddresses.length;

    const isPureBYOE = getIsBYOEOnlyAccount(addresses);
    /* When the user is in Inbox and has not selected emails, we want to show an extra button in the toolbar.
     * - When the user has a pure BYOE account (he has only BYOE addresses), show a button to claim a Proton address
     * - Show a list of addresses if the user has more than one address
     * - Else, show nothing
     */
    const canShowAddressesDropdown =
        (isPureBYOE || numberOfAddresses > 1) && labelID === MAILBOX_LABEL_IDS.INBOX && selectedIDs.length === 0;

    if (!canShowAddressesDropdown) {
        return null;
    }

    const handleCopy = (address: Address) => {
        textToClipboard(address.Email);
        createNotification({
            text: c('Notification').t`Link copied to clipboard`,
        });
    };

    return (
        <>
            {isPureBYOE ? (
                <InlineLinkButton className="color-weak" onClick={() => setClaimProtonAddressModalProps(true)}>
                    {c('Action').t`Claim ${BRAND_NAME} address`}
                </InlineLinkButton>
            ) : (
                <>
                    <InlineLinkButton className="color-weak" onClick={toggle} ref={anchorRef}>
                        {/*translator: This text is displayed in a button that is opening a dropdown listing the user addresses on which a message can be received*/}
                        {c('Action').ngettext(
                            msgid`${numberOfAddresses} address`,
                            `${numberOfAddresses} addresses`,
                            numberOfAddresses
                        )}
                    </InlineLinkButton>
                    <Dropdown
                        id={uid}
                        originalPlacement="bottom"
                        autoClose
                        isOpen={isOpen}
                        anchorRef={anchorRef}
                        onClose={close}
                        className="overflow-hidden"
                    >
                        <div className="p-4">
                            <h1 className="text-rg text-bold">{c('Title').t`Your addresses`}</h1>
                            <p className="color-weak mb-0 mt-1">
                                {c('Description').t`This view shows messages sent to the following addresses:`}
                            </p>
                        </div>
                        <DropdownMenu className="max-h-custom overflow-auto" style={{ '--max-h-custom': '15em' }}>
                            {internalAndBYOEAddresses.map((address) => {
                                return (
                                    <Tooltip title={c('Action').t`Copy email address`}>
                                        <DropdownMenuButton
                                            className="text-left flex flex-nowrap items-center gap-2 group-hover-opacity-container"
                                            onClick={() => handleCopy(address)}
                                            key={address.ID}
                                        >
                                            {getIsBYOEAddress(address) ? (
                                                <img src={googleLogo} className="mr-2 self-center shrink-0" alt="" />
                                            ) : (
                                                <ProtonLogo variant="glyph-only" size={4} className="mr-2 shrink-0" />
                                            )}
                                            <span className="sr-only">{c('Action').t`Copy email address`}</span>
                                            <span className="text-ellipsis flex-1" title={address.Email}>
                                                {address.Email}
                                            </span>

                                            <Icon name="squares" className="shrink-0 group-hover:opacity-100" />
                                        </DropdownMenuButton>
                                    </Tooltip>
                                );
                            })}
                        </DropdownMenu>
                        <div className="px-4 pt-2 pb-4 border-top border-weak">
                            <ButtonLike
                                as={SettingsLink}
                                path="/identity-addresses#addresses"
                                app={APPS.PROTONMAIL}
                                className="w-full"
                            >{c('Action').t`Manage addresses`}</ButtonLike>
                        </div>
                    </Dropdown>
                </>
            )}

            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal toApp={APPS.PROTONMAIL} {...claimProtonAddressModalProps} />
            )}
        </>
    );
};

export default ToolbarAddressesDropdown;
