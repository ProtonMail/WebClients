import { useCallback } from 'react';

import { c } from 'ttag';

import type { WasmApiEmailAddress, WasmApiWalletAccount } from '@proton/andromeda';
import { Info, Prompt, Toggle, useModalState } from '@proton/components/components';
import { InputFieldStacked } from '@proton/components/components/inputFieldStacked';
import { useAddresses, useOrganization, useUser } from '@proton/components/hooks';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { type IWasmApiWalletData } from '@proton/wallet';

import { Button } from '../../../atoms';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../../../contexts/WalletSetupModalContext';
import { EmailAddressCreationModal } from '../../EmailAddressCreationModal';
import { WalletUpgradeModal } from '../../WalletUpgradeModal';
import { EmailIntegrationModal } from '../EmailIntegrationModal';

interface Props {
    wallet: IWasmApiWalletData;
    walletAccount: WasmApiWalletAccount;
    /**
     * Expected to have only one element
     */
    value: WasmApiEmailAddress[];
    options: (readonly [WasmApiEmailAddress, boolean])[];
    loading: boolean;
    shouldShowBvEWarning: boolean;

    onRemoveAddress: (addressId: string) => void;
    onAddAddress: (addressId: string) => void;
    onReplaceAddress: (oldAddressId: string, addressId: string) => void;
}

export const EmailIntegrationInput = ({
    wallet,
    walletAccount,
    value,
    options,
    loading,
    shouldShowBvEWarning,
    onRemoveAddress,
    onAddAddress,
    onReplaceAddress,
}: Props) => {
    const [organization] = useOrganization();
    const [emailIntegrationModal, setEmailIntegrationModal] = useModalState();
    const [emailCreationModal, setEmailCreationModal] = useModalState();
    const [walletUpgradeModal, setWalletUpgradeModal] = useModalState();
    const [bveWarningPrompt, setBveWarningPrompt] = useModalState();

    const { open } = useWalletSetupModalContext();

    const [user] = useUser();
    const [addresses] = useAddresses();

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

    const canCreateAddress = user.isAdmin;

    const walletAccountCreation = (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <span
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            key="prompt-button"
            className="p-0 link link-focus color-norm"
            onKeyDown={(event) => {
                if (event.key === ' ') {
                    setBveWarningPrompt(true);
                }
            }}
            onClick={() => {
                open({ kind: WalletSetupModalKind.WalletAccountCreation, apiWalletData: wallet });
            }}
            role="button"
        >{c('Wallet preferences').t`creating a new BTC account`}</span>
    );

    const learnMore = (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <span
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            key="prompt-button"
            className="p-0 link link-focus color-norm"
            onClick={() => {
                setBveWarningPrompt(true);
            }}
            role="button"
        >{c('Wallet preferences').t`Learn more`}</span>
    );

    const isPrimaryAccount = walletAccount.Priority === 1;

    return (
        <>
            <InputFieldStacked isBigger isGroupElement>
                <div className="flex flex-row items-center justify-space-between">
                    <div className="flex flex-column items-start w-full">
                        <label
                            className="flex flex-nowrap justify-space-between items-center gap-2 w-full"
                            htmlFor={walletAccount.ID}
                        >
                            <span className="flex items-center gap-2">
                                <span className="flex-1 text-left">{c('Wallet preferences')
                                    .t`Receive Bitcoin via Email`}</span>
                                <Info url={getKnowledgeBaseUrl('/wallet-bitcoin-via-email')} />
                            </span>
                            <span className="shrink-0">
                                <Toggle
                                    id={walletAccount.ID}
                                    checked={value.length > 0}
                                    loading={loading}
                                    className="ml-auto"
                                    onChange={() => {
                                        if (value.length < 1) {
                                            setEmailIntegrationModal(true);
                                        } else {
                                            onRemoveAddress(linkedEmail?.ID);
                                        }
                                    }}
                                />
                            </span>
                        </label>
                        <span className="color-norm text-lg">{linkedEmail?.Email ?? ''}</span>
                    </div>
                </div>

                {(shouldShowBvEWarning || isPrimaryAccount) && !linkedEmail && (
                    <div className="mt-3">
                        <div>{c('Wallet preferences')
                            .jt`For better privacy, we recommend ${walletAccountCreation} for receiving Bitcoin via Email. ${learnMore}.`}</div>
                    </div>
                )}
            </InputFieldStacked>

            <EmailIntegrationModal
                loading={loading}
                onAddressSelect={(address) => {
                    handleAddressSelection(address.ID);
                }}
                canCreateAddress={canCreateAddress}
                onAddressCreation={() => {
                    if ((addresses?.length ?? 0) < (organization?.MaxAddresses ?? 0)) {
                        setEmailCreationModal(true);
                    } else {
                        setWalletUpgradeModal(true);
                    }
                }}
                addresses={options}
                linkedEmail={linkedEmail}
                {...emailIntegrationModal}
            />

            {canCreateAddress && (
                <EmailAddressCreationModal
                    onAddressCreated={(address) => {
                        emailCreationModal.onClose();
                        handleAddressSelection(address.ID);
                    }}
                    {...emailCreationModal}
                />
            )}

            <WalletUpgradeModal
                title={c('Wallet upgrade').t`Unlock more email addresses`}
                content={c('Wallet upgrade')
                    .t`An email can only be linked to one wallet account. To link an email to this wallet account, please remove an email from another wallet account or upgrade your plan to get more email addresses.`}
                {...walletUpgradeModal}
            />

            <Prompt
                {...bveWarningPrompt}
                buttons={[
                    <Button
                        shape="solid"
                        color="weak"
                        onClick={() => {
                            setBveWarningPrompt(false);
                        }}
                    >{c('Action').t`Got it`}</Button>,
                ]}
            >
                <div className="text-center">
                    <p>{c('Wallet preference')
                        .t`The Bitcoin blockchain is public, meaning every transaction is publicly visible. However, Bitcoin addresses are pseudonymous, meaning the sender and recipient identities are generally unknown.`}</p>
                    <p>{c('Wallet preference')
                        .t`When you receive Bitcoin via Email, the sender knows one of your Bitcoin addresses as well as your email. Due to Bitcoin's public blockchain, it is theoretically possible for a malicious sender to discover the existence of other BTC that you have if you send BTC from this account.`}</p>

                    {isPrimaryAccount ? (
                        <p>{c('Wallet preference')
                            .t`For most people, this does not matter because they are receiving BTC from people they trust. However, if you are worried about this, we recommend using this primary BTC account without enabling Receive Bitcoin via Email and transacting with your other BTC accounts with Receive Bitcoin via Email enabled. This will improve your blockchain privacy by keeping BTC in this account separate from any BTC that you receive automatically.`}</p>
                    ) : (
                        <p>{c('Wallet preference')
                            .t`For most people, this does not matter because they are receiving BTC from people they trust. However, if you are worried about this, you can create a new BTC account so that the new BTC you receive is separated from your existing BTC.`}</p>
                    )}
                </div>
            </Prompt>
        </>
    );
};
