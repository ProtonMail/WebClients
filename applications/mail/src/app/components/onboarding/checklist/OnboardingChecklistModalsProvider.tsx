import { type ReactNode, createContext, useContext } from 'react';

import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { BYOE_CLAIM_PROTON_ADDRESS_SOURCE } from '@proton/activation/src/constants';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { APPS } from '@proton/shared/lib/constants';

import MobileAppModal from './modals/MobileAppModal';
import ProtectInboxModal from './modals/ProtectInboxModal';
import StorageRewardModal from './modals/StorageRewardModal';

type ModalKey = 'protectLogin' | 'mobileApps' | 'storageReward' | 'claimProtonAddress';

interface OnboardingChecklistModalsContextProps {
    displayModal: (modal: ModalKey, show: boolean) => void;
    isModalOpened: (modal: ModalKey) => boolean;
}

const ModalContext = createContext<OnboardingChecklistModalsContextProps | undefined>(undefined);

export const useOnboardingChecklistModalsContext = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModalContext must be used within OnboardingChecklistProvider');
    }
    return context;
};

const OnboardingChecklistModalsProvider = ({ children }: { children: ReactNode }) => {
    const [protectLoginProps, setProtectModalOpen, renderProtectInbox] = useModalState();
    const [mobileAppsProps, setMobileAppsOpen, renderMobileApps] = useModalState();
    const [storageRewardProps, setStorageRewardOpen, renderStorageReward] = useModalState();
    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const displayModal = (modal: ModalKey, show: boolean) => {
        switch (modal) {
            case 'protectLogin':
                setProtectModalOpen(show);
                break;
            case 'mobileApps':
                setMobileAppsOpen(show);
                break;
            case 'storageReward':
                setStorageRewardOpen(show);
                break;
            case 'claimProtonAddress':
                setClaimProtonAddressModalProps(show);
                break;
        }
    };

    const isModalOpened = (modal: ModalKey) => {
        switch (modal) {
            case 'protectLogin':
                return protectLoginProps.open;
            case 'mobileApps':
                return mobileAppsProps.open;
            case 'storageReward':
                return storageRewardProps.open;
            case 'claimProtonAddress':
                return claimProtonAddressModalProps.open;
        }
    };

    return (
        <ModalContext.Provider value={{ displayModal, isModalOpened }}>
            {children}
            {renderProtectInbox && <ProtectInboxModal {...protectLoginProps} />}
            {renderMobileApps && <MobileAppModal {...mobileAppsProps} />}
            {renderStorageReward && <StorageRewardModal {...storageRewardProps} />}
            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    source={BYOE_CLAIM_PROTON_ADDRESS_SOURCE.MAIL_ONBOARDING}
                    {...claimProtonAddressModalProps}
                />
            )}
        </ModalContext.Provider>
    );
};

export default OnboardingChecklistModalsProvider;
