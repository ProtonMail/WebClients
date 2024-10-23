import { type ReactNode, useCallback } from 'react';

import { c } from 'ttag';

import { type WasmApiEmailAddress, type WasmApiWalletAccount, WasmKeychainKind } from '@proton/andromeda';
import { Icon, useModalState } from '@proton/components/index';
import clsx from '@proton/utils/clsx';
import { type IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton } from '../../../atoms';
import { useResponsiveContainerContext } from '../../../contexts/ResponsiveContainerContext';
import { EmailIntegrationModal } from '../../EmailIntegrationModal';
import { AddressTable } from '../AddressTable';
import { useAddressTable } from './useAddressTable';

interface Props {
    selectorOrTitle: ReactNode;
    apiWalletData: IWasmApiWalletData;
    apiAccount: WasmApiWalletAccount;
}

export const AddressTableWrapper = ({ selectorOrTitle, apiWalletData, apiAccount }: Props) => {
    const { isNarrow } = useResponsiveContainerContext();
    const [emailIntegrationModal, setEmailIntegrationModal, renderEmailIntegrationModal] = useModalState();

    const {
        emailIntegration,
        addresses,
        loading,
        bitcoinAddressPool,

        keychain,
        toggleKeychain,

        currentPage,
        handleNext,
        handlePrev,
        sync,
    } = useAddressTable({
        wallet: apiWalletData,
        walletAccount: apiAccount,
    });

    const linkedEmail: WasmApiEmailAddress | undefined = apiAccount.Addresses.at(0);

    const handleAddressSelection = useCallback(
        (addressID: string) => {
            if (linkedEmail) {
                void emailIntegration.onReplaceEmailAddress(linkedEmail.ID, addressID);
            } else {
                void emailIntegration.onAddEmailAddress(addressID);
            }

            emailIntegrationModal.onClose();
        },
        [emailIntegrationModal, linkedEmail, emailIntegration]
    );

    const availableAddresses = (
        <span key="available-addresses" className="color-norm">
            {`${bitcoinAddressPool?.length ?? 0}/${apiAccount.PoolSize}`}
        </span>
    );

    return (
        <>
            <div className={clsx('flex flex-column grow', isNarrow && 'bg-weak rounded-xl mx-2')}>
                <div
                    className={clsx(
                        'flex flex-row px-4 items-center justify-space-between h-custom',
                        isNarrow ? 'mt-6 mb-3 color-weak' : 'mt-10 mb-6'
                    )}
                    style={{ '--h-custom': '2.5rem' }}
                >
                    <div className="flex flex-row items-center">
                        {selectorOrTitle}

                        <div className="ml-6">
                            {!linkedEmail ? (
                                <Button
                                    size="small"
                                    color="norm"
                                    onClick={() => {
                                        setEmailIntegrationModal(true);
                                    }}
                                >
                                    {c('Address list').t`Activate Bitcoin via Email`}
                                </Button>
                            ) : (
                                <Button
                                    size="small"
                                    color="norm"
                                    shape="ghost"
                                    className="button-lighter"
                                    onClick={() => {
                                        setEmailIntegrationModal(true);
                                    }}
                                >
                                    {c('Address list').jt`Bitcoin via Email ${availableAddresses}`}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div>
                        <Button
                            size="small"
                            shape="ghost"
                            color="norm"
                            className="ml-2 rounded-full bg-weak"
                            disabled={loading}
                            onClick={() => toggleKeychain()}
                        >
                            {keychain === WasmKeychainKind.External
                                ? c('Wallet header').t`View change addresses`
                                : c('Wallet header').t`View receive addresses`}
                            <Icon name="arrows-switch" className="ml-2" alt={c('Address list').t`Toggle keychain`} />
                        </Button>

                        <CoreButton
                            icon
                            size={isNarrow ? 'small' : 'medium'}
                            shape="ghost"
                            color="weak"
                            className="ml-2 rounded-full bg-weak"
                            disabled={loading}
                            onClick={() => sync(true)}
                        >
                            <Icon name="arrows-rotate" size={isNarrow ? 4 : 5} alt={c('Address list').t`Sync`} />
                        </CoreButton>
                    </div>
                </div>

                <div className="flex flex-column w-full grow flex-nowrap grow">
                    <AddressTable
                        apiAccount={apiAccount}
                        addresses={addresses}
                        loading={loading}
                        bitcoinAddressPool={bitcoinAddressPool}
                        currentPage={currentPage}
                        handleNext={handleNext}
                        handlePrev={handlePrev}
                        keychain={keychain}
                    />
                </div>
            </div>

            {renderEmailIntegrationModal && (
                <EmailIntegrationModal
                    {...emailIntegrationModal}
                    linkedEmail={apiAccount.Addresses.at(0)}
                    loading={emailIntegration.isLoadingEmailUpdate}
                    addresses={emailIntegration.addressesWithAvailability}
                    onAddressSelect={(address) => {
                        handleAddressSelection(address.ID);
                    }}
                />
            )}
        </>
    );
};
