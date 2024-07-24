import { c } from 'ttag';

import type { WasmApiEmailAddress } from '@proton/andromeda';
import { Href } from '@proton/atoms/Href';
import type { ModalOwnProps } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Button, ButtonLike, CoreButton, Modal } from '../../../atoms';

interface Props extends ModalOwnProps {
    loading: boolean;
    addresses: (readonly [WasmApiEmailAddress, boolean])[];
    canCreateAddress: boolean;
    onAddressSelect: (address: WasmApiEmailAddress) => void;
    onAddressCreation: () => void;
}

export const EmailIntegrationModal = ({
    loading,
    addresses,
    canCreateAddress,
    onAddressSelect,
    onAddressCreation,
    ...modalProps
}: Props) => {
    return (
        <Modal title={c('Wallet Settings').t`Bitcoin via Email`} {...modalProps}>
            <div className="mb-4">
                <p className="text-center color-weak my-0">{c('Wallet Settings')
                    .t`Link an email to this wallet account so other ${WALLET_APP_NAME} users can easily send bitcoin to your email.`}</p>
                <p className="text-center color-weak my-0 mt-2">{c('Wallet Settings')
                    .t`Select an available email or create a new email address.`}</p>
            </div>

            <div className="flex flex-column gap-1 my-4">
                {addresses.map(([address, available]) => (
                    <CoreButton
                        shape="solid"
                        color="weak"
                        className="unstyled p-4 text-left rounded-xl"
                        key={address.ID}
                        disabled={!available}
                        onClick={() => {
                            onAddressSelect(address);
                        }}
                        aria-label={
                            // translator: Use <email address>
                            c('Action').t`Use ${address.Email}`
                        }
                    >
                        {address.Email}
                    </CoreButton>
                ))}
            </div>

            <div className="flex flex-column w-full">
                {canCreateAddress && (
                    <Button
                        disabled={loading}
                        fullWidth
                        shape="solid"
                        color="norm"
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
