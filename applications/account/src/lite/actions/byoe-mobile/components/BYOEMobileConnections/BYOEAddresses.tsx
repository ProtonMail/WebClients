import { useState } from 'react';

import { c } from 'ttag';

import { ApiImportProvider } from '@proton/activation/src/api/api.interface';
import { getIsActiveBYOEAddress } from '@proton/activation/src/helpers/byoeAddresses';
import { useBYOEAddresses } from '@proton/activation/src/hooks/useBYOEAddresses';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { Address } from '@proton/shared/lib/interfaces';

import { useBYOEMobile } from '../../context/BYOEMobileProvider';
import { ConfirmBYOEDisconnectionPrompt } from './ConfirmBYOEDisconnectionPrompt';
import { ConnectionsSection } from './ConnectionsSection';
import { ConnectionSectionStringContent, ConnectionsSectionRow } from './ConnectionsSectionRow';

export const BYOEAddresses = () => {
    const { addresses } = useBYOEAddresses();
    const { status, isLoading, connectingEmail, reconnectAddress } = useBYOEMobile();

    const [selectedItem, setSelectedItem] = useState<Address | null>(null);
    const [modalProps, showValidationPrompt, renderModal] = useModalState();

    const handleChange = (item: Address) => {
        if (getIsActiveBYOEAddress(item)) {
            setSelectedItem(item);
            showValidationPrompt(true);
        } else {
            void reconnectAddress(item);
        }
    };

    // Nothing is displayed when the list is empty. The loading state is handled by BYOEMobileConnections
    if (addresses.length === 0) {
        return null;
    }

    return (
        <ConnectionsSection title={c('Title').t`Addresses`}>
            {addresses.map((item) => {
                const isConnected = getIsActiveBYOEAddress(item);
                // Both statuses leave the toggle in place: the page is either reconnecting or about to go to Google
                const isReconnecting =
                    (status === 'reconnecting' || status === 'starting-oauth') && connectingEmail === item.Email;

                // APIProvider can only be google for now
                return (
                    <ConnectionsSectionRow key={item.ID} apiProvider={ApiImportProvider.GOOGLE}>
                        <ConnectionSectionStringContent
                            firstLine={item.Email}
                            secondLine={isConnected ? c('Info').t`Connected` : c('Info').t`Disconnected`}
                        />
                        <Toggle
                            id={`byoe-address-${item.ID}`}
                            aria-label={item.Email}
                            checked={isConnected}
                            onChange={() => handleChange(item)}
                            loading={isReconnecting}
                            disabled={isLoading}
                        />
                    </ConnectionsSectionRow>
                );
            })}
            {selectedItem && renderModal && (
                <ConfirmBYOEDisconnectionPrompt
                    {...modalProps}
                    onExit={() => {
                        modalProps.onExit();
                        setSelectedItem(null);
                    }}
                    address={selectedItem}
                />
            )}
        </ConnectionsSection>
    );
};
