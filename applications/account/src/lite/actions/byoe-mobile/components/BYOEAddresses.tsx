import { useState } from 'react';

import { c } from 'ttag';

import { getIsActiveBYOEAddress } from '@proton/activation/src/helpers/byoeAddresses';
import { useBYOEAddresses } from '@proton/activation/src/hooks/useBYOEAddresses';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import type { Address } from '@proton/shared/lib/interfaces';
import googleLogo from '@proton/styles/assets/img/import/providers/google.svg';

import { useBYOEMobile } from '../context/BYOEMobileProvider';
import { CollapsibleSection } from './CollapsibleSection';
import { ConfirmBYOEDisconnection } from './ConfirmBYOEDisconnection';

export const BYOEAddresses = () => {
    const { addresses, loading } = useBYOEAddresses();
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

    // Nothing is displayed when the list is empty or loading
    if (loading || addresses.length === 0) {
        return null;
    }

    return (
        <CollapsibleSection title={c('Title').t`Addresses`}>
            {addresses.map((item) => {
                const isConnected = getIsActiveBYOEAddress(item);
                // Both statuses leave the toggle in place: the page is either reconnecting or about to go to Google
                const isReconnecting =
                    (status === 'reconnecting' || status === 'starting-oauth') && connectingEmail === item.Email;

                return (
                    <div key={item.ID} className="flex flex-nowrap items-center gap-4 bg-norm rounded-xl px-4 py-3">
                        <div
                            className="shrink-0 flex items-center justify-center border border-weak rounded-lg w-custom h-custom"
                            style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                        >
                            <img src={googleLogo} alt="" width={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="m-0 text-ellipsis">{item.Email}</p>
                            <p className="m-0 text-sm color-weak">
                                {isConnected ? c('Info').t`Connected` : c('Info').t`Disconnected`}
                            </p>
                        </div>
                        <Toggle
                            id={`byoe-address-${item.ID}`}
                            aria-label={c('Label').t`Connect ${item.Email}`}
                            checked={isConnected}
                            onChange={() => handleChange(item)}
                            loading={isReconnecting}
                            disabled={isLoading}
                        />
                    </div>
                );
            })}
            {selectedItem && renderModal && (
                <ConfirmBYOEDisconnection
                    {...modalProps}
                    onExit={() => {
                        modalProps.onExit();
                        setSelectedItem(null);
                    }}
                    address={selectedItem}
                />
            )}
        </CollapsibleSection>
    );
};
