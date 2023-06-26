import { useEffect, useState } from 'react';

import { EasySwitchProvider } from '@proton/activation/index';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { GmailSyncModal } from '@proton/components/containers/gmailSyncModal';
import { useApi, useUserSettings } from '@proton/components/hooks';
import useWelcomeFlags from '@proton/components/hooks/useWelcomeFlags';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';

import MailStartupModals from '../../containers/MailStartupModals';

const MailOnboardingWrapper = () => {
    const api = useApi();
    const [userSettings] = useUserSettings();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();

    // The modal state is handled inside the MailStartupModals component
    const [openStartupModal, setOpenStartupModal] = useState(false);
    const [syncModalProps, setSyncModalOpen, renderSyncModal] = useModalState();

    useEffect(() => {
        setSyncModalOpen(!welcomeFlags.isDone);
    }, [welcomeFlags]);

    const handleSyncCallback = async (hasError: boolean) => {
        if (!hasError) {
            setWelcomeFlagsDone();

            if (welcomeFlags.isWelcomeFlow) {
                // Set generic welcome to true
                await api(updateFlags({ Welcomed: 1 })).catch(noop);
            }
            if (!userSettings.WelcomeFlag) {
                // Set product specific welcome to true
                await api(updateWelcomeFlags()).catch(noop);
            }

            setSyncModalOpen(false);
        }
    };

    const handleSyncSkip = () => {
        setOpenStartupModal(true);
    };

    return (
        <EasySwitchProvider>
            <>
                {renderSyncModal && (
                    <GmailSyncModal
                        onSyncCallback={handleSyncCallback}
                        onSyncSkipCallback={handleSyncSkip}
                        {...syncModalProps}
                    />
                )}
                <MailStartupModals onboardingOpen={openStartupModal} />
            </>
        </EasySwitchProvider>
    );
};

export default MailOnboardingWrapper;
