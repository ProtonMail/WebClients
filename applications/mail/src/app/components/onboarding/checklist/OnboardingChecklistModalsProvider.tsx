import { type ReactNode, createContext, useContext } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { EasySwitchProvider, GmailSyncModal } from '@proton/activation';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { useModalState } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash/index';

import AccountsLoginModal from './modals/AccountsLoginModal';
import MobileAppModal from './modals/MobileAppModal';
import ProtectInboxModal from './modals/ProtectInboxModal';
import StorageRewardModal from './modals/StorageRewardModal';

type ModalKey = 'gmailForward' | 'protectLogin' | 'login' | 'mobileApps' | 'storageReward' | 'claimProtonAddress';

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
    const [user] = useUser();
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail') && isAdmin(user);

    const [gmailForwardProps, setGmailForwardOpen, renderGmailForward] = useModalState();
    const [protectLoginProps, setProtectModalOpen, renderProtectInbox] = useModalState();
    const [loginModalProps, setLoginModalOpen, renderLogin] = useModalState();
    const [mobileAppsProps, setMobileAppsOpen, renderMobileApps] = useModalState();
    const [storageRewardProps, setStorageRewardOpen, renderStorageReward] = useModalState();
    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const displayModal = (modal: ModalKey, show: boolean) => {
        switch (modal) {
            case 'gmailForward':
                setGmailForwardOpen(show);
                break;
            case 'protectLogin':
                setProtectModalOpen(show);
                break;
            case 'login':
                setLoginModalOpen(show);
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
            case 'gmailForward':
                return gmailForwardProps.open;
            case 'protectLogin':
                return protectLoginProps.open;
            case 'login':
                return loginModalProps.open;
            case 'mobileApps':
                return mobileAppsProps.open;
            case 'storageReward':
                return storageRewardProps.open;
            case 'claimProtonAddress':
                return claimProtonAddressModalProps.open;
        }
    };

    return (
        <EasySwitchProvider>
            <ModalContext.Provider value={{ displayModal, isModalOpened }}>
                {children}
                {renderProtectInbox && <ProtectInboxModal {...protectLoginProps} />}
                {renderLogin && <AccountsLoginModal {...loginModalProps} />}
                {renderMobileApps && <MobileAppModal {...mobileAppsProps} />}
                {renderStorageReward && <StorageRewardModal {...storageRewardProps} />}
                {renderGmailForward && (
                    <GmailSyncModal
                        source={EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST}
                        noSkip
                        onSyncCallback={(hasError?: boolean) => {
                            if (!hasError) {
                                setGmailForwardOpen(false);
                            }
                        }}
                        hasAccessToBYOE={hasAccessToBYOE}
                        {...gmailForwardProps}
                    />
                )}
                {renderClaimProtonAddressModal && (
                    <BYOEClaimProtonAddressModal toApp={APPS.PROTONMAIL} {...claimProtonAddressModalProps} />
                )}
            </ModalContext.Provider>
        </EasySwitchProvider>
    );
};

export default OnboardingChecklistModalsProvider;
