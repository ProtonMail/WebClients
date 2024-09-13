import { useState } from 'react';

import { c } from 'ttag';

import type { WasmApiEmailAddress } from '@proton/andromeda';
import { Href } from '@proton/atoms';
import type { ModalOwnProps } from '@proton/components';
import { Radio } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Button, ButtonLike, Modal } from '../../../atoms';

import './EmailIntegrationModal.scss';

interface Props extends ModalOwnProps {
    loading: boolean;
    addresses: (readonly [WasmApiEmailAddress, boolean])[];
    canCreateAddress: boolean;
    onAddressSelect: (address: WasmApiEmailAddress) => void;
    onAddressCreation: () => void;
    linkedEmail?: WasmApiEmailAddress;
}

export const EmailIntegrationModal = ({
    loading,
    addresses,
    canCreateAddress,
    onAddressSelect,
    onAddressCreation,
    linkedEmail,
    ...modalProps
}: Props) => {
    const [selectedAddress, setSelectedAddress] = useState(linkedEmail);
    const onAddressValidation = () => {
        if (selectedAddress) {
            onAddressSelect(selectedAddress);
        }
    };

    return (
        <Modal className="email-integration-modal" title={c('Wallet Settings').t`Bitcoin via Email`} {...modalProps}>
            <div className="mb-4">
                <p className="text-center color-weak my-0">{c('Wallet Settings')
                    .t`Link an email to this wallet account so other ${WALLET_APP_NAME} users can easily send bitcoin to your email.`}</p>
                <p className="text-center color-weak my-0 mt-2">{c('Wallet Settings')
                    .t`Select an available email or create a new email address.`}</p>
            </div>

            <div className="flex flex-column gap-1 my-4">
                {addresses.map(([address, available]) => (
                    <Radio
                        id={address.ID}
                        key={address.ID}
                        name={address.Email}
                        value={address.Email}
                        disabled={!available}
                        checked={selectedAddress?.ID === address.ID}
                        onClick={() => {
                            setSelectedAddress(address);
                        }}
                        aria-label={
                            // translator: Use <email address>
                            c('Action').t`Use ${address.Email}`
                        }
                        className="unstyled p-4 text-left rounded-xl"
                    >
                        {address.Email}
                    </Radio>
                ))}
            </div>

            <div className="flex flex-column w-full">
                <Button
                    disabled={!selectedAddress || loading}
                    fullWidth
                    shape="solid"
                    color="weak"
                    className="mt-2"
                    onClick={() => {
                        onAddressValidation();
                    }}
                >{c('Wallet Settings').t`Select this address`}</Button>
                {canCreateAddress && (
                    <Button
                        disabled={loading}
                        fullWidth
                        shape="solid"
                        color="weak"
                        className="mt-2"
                        onClick={() => {
                            onAddressCreation();
                        }}
                    >{c('Wallet Settings').t`Create new email address`}</Button>
                )}
                <ButtonLike
                    as={Href}
                    href={getKnowledgeBaseUrl('/wallet-bitcoin-via-email')}
                    disabled={loading}
                    fullWidth
                    shape="underline"
                    color="norm"
                    className="mt-2"
                >{c('Action').t`Learn more about Bitcoin via Email`}</ButtonLike>
            </div>
        </Modal>
    );
};
