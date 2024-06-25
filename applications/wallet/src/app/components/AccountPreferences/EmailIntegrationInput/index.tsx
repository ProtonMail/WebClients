import { useCallback } from 'react';

import { c } from 'ttag';

import { WasmApiEmailAddress } from '@proton/andromeda';
import { Toggle, useModalState } from '@proton/components/components';
import { useMembers, useUser } from '@proton/components/hooks';

import { EmailAddressCreationModal } from '../../EmailAddressCreationModal';
import { WalletUpgradeModal } from '../../WalletUpgradeModal';
import { EmailIntegrationModal } from '../EmailIntegrationModal';

interface Props {
    walletAccountId: string;
    /**
     * Expected to have only one element
     */
    value: WasmApiEmailAddress[];
    options: (readonly [WasmApiEmailAddress, boolean])[];
    loading: boolean;

    onRemoveAddress: (addressId: string) => void;
    onAddAddress: (addressId: string) => void;
    onReplaceAddress: (oldAddressId: string, addressId: string) => void;
}

export const EmailIntegrationInput = ({
    walletAccountId,
    value,
    options,
    loading,
    onRemoveAddress,
    onAddAddress,
    onReplaceAddress,
}: Props) => {
    const [emailIntegrationModal, setEmailIntegrationModal] = useModalState();
    const [emailCreationModal, setEmailCreationModal] = useModalState();
    const [walletUpgradeModal, setWalletUpgradeModal] = useModalState();

    const [user] = useUser();
    const [members] = useMembers();

    const linkedEmail: WasmApiEmailAddress | undefined = value?.[0];

    const handleAddressSelection = useCallback(
        (addressID: string) => {
            if (linkedEmail) {
                onReplaceAddress(linkedEmail.ID, addressID);
            } else {
                onAddAddress(addressID);
            }

            emailIntegrationModal.onClose();
        },
        [emailIntegrationModal, linkedEmail, onAddAddress, onReplaceAddress]
    );

    return (
        <>
            <div className="px-6 py-5">
                <div className="flex flex-row items-center justify-space-between">
                    <div className="flex flex-column items-start">
                        <span className="color-hint mb-1">{c('Wallet preferences').t`Email integration`}</span>
                        <span className="color-norm text-lg">{linkedEmail?.Email ?? ''}</span>
                    </div>

                    <Toggle
                        id={walletAccountId}
                        checked={value.length > 0}
                        onChange={() => {
                            if (value.length < 1) {
                                setEmailIntegrationModal(true);
                            } else {
                                onRemoveAddress(linkedEmail?.ID);
                            }
                        }}
                    />
                </div>
            </div>

            <EmailIntegrationModal
                loading={loading}
                onAddressSelect={(address) => {
                    handleAddressSelection(address.ID);
                }}
                canCreateAddress={!user.isSubUser}
                onAddressCreation={() => {
                    if (members?.length) {
                        setEmailCreationModal(true);
                    } else {
                        setWalletUpgradeModal(true);
                    }
                }}
                addresses={options}
                {...emailIntegrationModal}
            />

            <EmailAddressCreationModal
                onAddressCreated={(address) => {
                    emailCreationModal.onClose();
                    handleAddressSelection(address.ID);
                }}
                {...emailCreationModal}
            />

            <WalletUpgradeModal
                title={c('Wallet upgrade').t`Unlock more email addresses`}
                content={c('Wallet upgrade')
                    .t`An email can only be linked to one wallet account. To link an email to this wallet account, please remove an email from another wallet account or upgrade your plan to get more email addresses.`}
                {...walletUpgradeModal}
            />
        </>
    );
};
