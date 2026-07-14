import { useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { useFlag } from '@proton/unleash/useFlag';

import { AlwaysOnPolicyServiceProvider } from '../../contexts/AlwaysOnPolicyServiceContext';
import { useAlwaysOnPolicy } from '../../hooks/useAlwaysOnPolicy';
import { useAlwaysOnPolicyTelemetry } from '../../hooks/useAlwaysOnPolicyTelemetry';
import { ConfigureProfileModal } from './modals/ConfigureProfileModal/ConfigureProfileModal';
import { InstructionsModal } from './modals/InstructionsModal/InstructionsModal';
import { RemoveProfileModal } from './modals/RemoveProfileModal';
import { ConfiguredProfileView } from './views/ConfiguredProfileView';
import { UnconfiguredProfileView } from './views/UnconfiguredProfileView';

const AlwaysOnOverview = () => {
    const { policy, isLoading, setPolicy } = useAlwaysOnPolicy();
    const { sendConfigureOpenedReport, sendInstructionsViewedReport, sendRemoveModalOpenedReport } =
        useAlwaysOnPolicyTelemetry();
    const [configureModalOpen, setConfigureModalOpen] = useState(false);
    const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
    const [removeModalOpen, setRemoveModalOpen] = useState(false);

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
            <div className="flex flex-column gap-2">
                <SettingsPageTitle>{c('Title').t`Always-on VPN`}</SettingsPageTitle>
                <span className="color-weak">
                    {c('Info')
                        .t`Enforce VPN usage across your organization by blocking internet access unless a VPN connection is active.`}{' '}
                    <Href className="color-weak" href={getKnowledgeBaseUrl('/mdm-always-on-vpn')}>
                        {c('Link').t`Learn more`}
                    </Href>
                </span>
            </div>

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
