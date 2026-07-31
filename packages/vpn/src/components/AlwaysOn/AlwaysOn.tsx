import { useState } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Loader } from '@proton/components/index';
import { hasVpnPro } from '@proton/payments/core/subscription/helpers';
import { useFlag } from '@proton/unleash/useFlag';

import { AlwaysOnPolicyServiceProvider } from '../../contexts/AlwaysOnPolicyServiceContext';
import { useAlwaysOnPolicy } from '../../hooks/useAlwaysOnPolicy';
import { useAlwaysOnPolicyTelemetry } from '../../hooks/useAlwaysOnPolicyTelemetry';
import { ConfigureProfileModal } from './modals/ConfigureProfileModal/ConfigureProfileModal';
import { InstructionsModal } from './modals/InstructionsModal/InstructionsModal';
import { RemoveProfileModal } from './modals/RemoveProfileModal';
import { ConfiguredProfileView } from './views/ConfiguredProfileView';
import { UnconfiguredProfileView } from './views/UnconfiguredProfileView';
import { UpgradeView } from './views/UpgradeView';

const AlwaysOnOverview = () => {
    const { policy, isLoading, setPolicy } = useAlwaysOnPolicy();
    const { sendConfigureOpenedReport, sendInstructionsViewedReport, sendRemoveModalOpenedReport } =
        useAlwaysOnPolicyTelemetry();
    const [configureModalOpen, setConfigureModalOpen] = useState(false);
    const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [subscription, isSubscriptionLoading] = useSubscription();
    const isPlanVpnEssentials = hasVpnPro(subscription);

    if (isSubscriptionLoading) {
        return <Loader />;
    }
    if (isPlanVpnEssentials) {
        return <UpgradeView />;
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center py-14">
                    <CircleLoader size="large" />
                </div>
            );
        }
        if (policy === null) {
            return (
                <UnconfiguredProfileView
                    onConfigure={() => {
                        sendConfigureOpenedReport('call-to-action');
                        setConfigureModalOpen(true);
                    }}
                />
            );
        }

        return (
            <ConfiguredProfileView
                policy={policy}
                onShowInstructions={() => {
                    sendInstructionsViewedReport();
                    setInstructionsModalOpen(true);
                }}
                onReconfigure={() => {
                    sendConfigureOpenedReport('reconfigure');
                    setConfigureModalOpen(true);
                }}
                onRemove={() => {
                    sendRemoveModalOpenedReport();
                    setRemoveModalOpen(true);
                }}
            />
        );
    };

    return (
        <div className="flex gap-12 flex-column">
            {renderContent()}

            <ConfigureProfileModal
                open={configureModalOpen}
                onClose={() => setConfigureModalOpen(false)}
                onConfigured={setPolicy}
                enableCloseWhenClickOutside
            />

            <InstructionsModal
                open={instructionsModalOpen}
                onClose={() => setInstructionsModalOpen(false)}
                windows={policy?.Artifacts.windows}
                rego={policy?.Artifacts.rego}
                enableCloseWhenClickOutside
            />

            <RemoveProfileModal
                open={removeModalOpen}
                onClose={() => setRemoveModalOpen(false)}
                windowsUninstall={policy?.Artifacts.windowsUninstall}
                enableCloseWhenClickOutside
            />
        </div>
    );
};

export const AlwaysOn = () => {
    const isAlwaysOnEnabled = useFlag('B2BAlwaysOnEnabled');

    return isAlwaysOnEnabled ? (
        <AlwaysOnPolicyServiceProvider>
            <AlwaysOnOverview />
        </AlwaysOnPolicyServiceProvider>
    ) : null;
};
