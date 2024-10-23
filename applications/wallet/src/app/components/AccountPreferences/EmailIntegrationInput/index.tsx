import { useCallback } from 'react';

import { c } from 'ttag';

import type { WasmApiEmailAddress, WasmApiWalletAccount } from '@proton/andromeda';
import { Info, Prompt, Toggle, useModalState } from '@proton/components';
import InputFieldStacked from '@proton/components/components/inputFieldStacked/InputFieldStacked';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { type IWasmApiWalletData } from '@proton/wallet';

import { Button } from '../../../atoms';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../../../contexts/WalletSetupModalContext';
import { EmailIntegrationModal } from '../../EmailIntegrationModal';

interface Props {
    wallet: IWasmApiWalletData;
    walletAccount: WasmApiWalletAccount;
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
    options,
    loading,
    shouldShowBvEWarning,
    onRemoveAddress,
    onAddAddress,
    onReplaceAddress,
}: Props) => {
    const [emailIntegrationModal, setEmailIntegrationModal] = useModalState();
    const [bveWarningPrompt, setBveWarningPrompt] = useModalState();

    const { open } = useWalletSetupModalContext();

    const linkedEmail: WasmApiEmailAddress | undefined = walletAccount.Addresses.at(0);

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
                                    checked={!!linkedEmail}
                                    loading={loading}
                                    className="ml-auto"
                                    onChange={() => {
                                        if (!linkedEmail) {
                                            setEmailIntegrationModal(true);
                                        } else if (linkedEmail) {
                                            onRemoveAddress(linkedEmail.ID);
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
                linkedEmail={linkedEmail}
                addresses={options}
                onAddressSelect={(address) => {
                    handleAddressSelection(address.ID);
                }}
                {...emailIntegrationModal}
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
