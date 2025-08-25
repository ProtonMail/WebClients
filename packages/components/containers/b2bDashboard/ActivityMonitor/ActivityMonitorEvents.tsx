import { useState } from 'react';

import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { deleteOrgUsersAuthLogs } from '@proton/shared/lib/api/b2bevents';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';

import AuthenticationLogs from '../../organization/AuthenticationLogs';
import TogglingMonitoringModal from './TogglingMonitoringModal';
import WipeLogsModal from './WipeLogsModal';
import { updateMonitoringSetting } from './api';
import B2BOrganizationUpsellBanner from './B2BOrganizationUpsellBanner';

const ActivityMonitorEvents = () => {
    const api = useApi();
    const [organization] = useOrganization();
    const monitoring = organization?.Settings?.LogAuth === 1 || organization?.Settings?.LogAuth === 2;
    const [togglingMonitoringModalProps, setTogglingMonitoringModalOpen, togglingMonitoringModalRender] =
        useModalState();
    const [togglingMonitoringLoading, setTogglingMonitoringLoading] = useState<boolean>(false);
    const [wipeLogsModalProps, setWipeLogsModalOpen, wipeLogsModalRender] = useModalState();
    const [wipeLogsFlag, setWipeLogsFlag] = useState(false);
    const dispatch = useDispatch();

    // Defensive protection, ensure that the settings are available
    if (!organization || !organization.Settings || !organization.Settings.OrganizationPolicy) {
        return null;
    }

    const setActivityMonitoring = async () => {
        try {
            const enabling = !monitoring;
            const newValue = enabling ? 1 : 0;
            await api<OrganizationSettings>(updateMonitoringSetting(newValue));
            dispatch(organizationActions.updateOrganizationSettings({ value: { LogAuth: newValue } }));

            setTogglingMonitoringModalOpen(false);
            setTogglingMonitoringLoading(false);
        } catch (e) {
            setTogglingMonitoringModalOpen(false);

            throw e;
        } finally {
            setTogglingMonitoringLoading(false);
        }
    };

    const toggleMonitoring = async () => {
        if (togglingMonitoringLoading) {
            return;
        }

        if (monitoring) {
            setTogglingMonitoringModalOpen(true);
        }
    };

    const setWipeLogs = async () => {
        try {
            await api(deleteOrgUsersAuthLogs());

            setWipeLogsFlag(true);
            setWipeLogsModalOpen(false);
        } catch (e) {
            setWipeLogsModalOpen(false);

            throw e;
        }
    };

    return (
        organization.Settings.OrganizationPolicy.Enforced === 0 ? (
            <B2BOrganizationUpsellBanner organization={organization}/>
        ) : (
            <>
                <SettingsSectionWide customWidth="90em">
                    <div className="flex flex-row justify-space-between items-center my-4">
                        <div className="flex *:min-size-auto flex-column gap-2 w-full">
                            <div className="flex flex-row flex-nowrap items-center gap-2 p-4 rounded-lg border border-solid border-weak">
                                <Toggle
                                    id="monitoring-toggle"
                                    loading={togglingMonitoringLoading}
                                    checked={monitoring}
                                    onChange={monitoring ? toggleMonitoring : setActivityMonitoring}
                                />
                                <div className='flex flex-column'>
                                    <span className='text-bold'>{c('Info').t`Account monitor`}</span>
                                    <span className='color-weak'>{c('Message').t`View user sign-in, recovery and security events.`}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <AuthenticationLogs
                            organization={organization}
                            activityMonitorSection={true}
                            wipeLogs={wipeLogsFlag}
                            monitoring={monitoring}
                        />
                    </div>
                </SettingsSectionWide>
                {togglingMonitoringModalRender && (
                    <TogglingMonitoringModal {...togglingMonitoringModalProps} onChange={setActivityMonitoring} />
                )}
                {wipeLogsModalRender && <WipeLogsModal {...wipeLogsModalProps} onChange={setWipeLogs} />}
            </>
        )
    );
};

export default ActivityMonitorEvents;
