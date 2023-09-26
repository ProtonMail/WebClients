import { useEffect, useState } from 'react';

import { EasySwitchProvider } from '@proton/activation/index';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useFlag } from '@proton/components/containers';
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

    const isImporterInMaintenance = useFlag('MaintenanceImporter');

    useEffect(() => {
        // Show the onboarding modal if easy switch importer are disabled for maintenance
        if (isImporterInMaintenance) {
            setOpenStartupModal(!welcomeFlags.isDone);
        } else {
            setSyncModalOpen(!welcomeFlags.isDone);
        }
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
                {renderSyncModal && !isImporterInMaintenance && (
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
