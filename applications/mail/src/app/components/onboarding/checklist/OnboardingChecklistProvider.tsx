import React, { type ReactNode, createContext, useContext } from 'react';

import { EasySwitchProvider } from '@proton/activation/index';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { GmailSyncModal, useModalState } from '@proton/components/index';

import AccountsLoginModal from './modals/AccountsLoginModal';
import MobileAppModal from './modals/MobileAppModal';
import ProtectInboxModal from './modals/ProtectInboxModal';
import StorageRewardModal from './modals/StorageRewardModal';

type ModalKey = 'gmailForward' | 'protectLogin' | 'login' | 'mobileApps' | 'storageReward';

interface OnboardingChecklistContextProps {
    displayModal: (modal: ModalKey, show: boolean) => void;
    isModalOpened: (modal: ModalKey) => boolean;
}

const ModalContext = createContext<OnboardingChecklistContextProps | undefined>(undefined);

export const useOnboardingChecklistContext = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModalContext must be used within OnboardingChecklistProvider');
    }
    return context;
};

const OnboardingChecklistProvider = ({ children }: { children: ReactNode }) => {
    const [gmailForwardProps, setGmailForwardOpen, renderGmailForward] = useModalState();
    const [protectLoginProps, setProtectModalOpen, renderProtectInbox] = useModalState();
    const [loginModalProps, setLoginModalOpen, renderLogin] = useModalState();
    const [mobileAppsProps, setMobileAppsOpen, renderMobileApps] = useModalState();
    const [storageRewardProps, setStorageRewardOpen, renderStorageReward] = useModalState();

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
                        {...gmailForwardProps}
                    />
                )}
            </ModalContext.Provider>
        </EasySwitchProvider>
    );
};

export default OnboardingChecklistProvider;
