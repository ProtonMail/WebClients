import { useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { deleteOrgUsersAuthLogs } from '@proton/shared/lib/api/b2bevents';
import { type B2BAuthLog } from '@proton/shared/lib/authlog';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';

import SettingsParagraph from '../../account/SettingsParagraph';
import AuthenticationLogs from '../../organization/AuthenticationLogs';
import TogglingMonitoringModal from './TogglingMonitoringModal';
import WipeLogsModal from './WipeLogsModal';
import { updateMonitoringSetting } from './api';
import B2BOrganizationUpsellBanner from './B2BOrganizationUpsellBanner';
import { escapeCsvValue } from '@proton/components/helpers/escapeCsvValue';

const ActivityMonitorDescription = () => {
    return (
        <SettingsParagraph inlineLearnMore learnMoreUrl={getPrivacyPolicyURL()}>
            {c('Message').t`View account-related events across your organization.`}
        </SettingsParagraph>
    );
};

const ActivityMonitorEvents = () => {
    const api = useApi();
    const [organization] = useOrganization();
    const monitoring = organization?.Settings?.LogAuth === 1 || organization?.Settings?.LogAuth === 2;
    const [logs, setLogs] = useState<B2BAuthLog[]>([]);
    const [togglingMonitoringModalProps, setTogglingMonitoringModalOpen, togglingMonitoringModalRender] =
        useModalState();
    const [togglingMonitoringLoading, setTogglingMonitoringLoading] = useState<boolean>(false);
    const [wipeLogsModalProps, setWipeLogsModalOpen, wipeLogsModalRender] = useModalState();
    const [wipeLogsFlag, setWipeLogsFlag] = useState(false);
    const [loadingDownload, withLoadingDownload] = useLoading();
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const dispatch = useDispatch();

    // Defensive protection, ensure that the settings are available
    if (!organization || !organization.Settings || !organization.Settings.OrganizationPolicy) {
        return null;
    }

    const triggerReload = () => {
        setReloadTrigger((prev) => prev + 1);
    };

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

    const handleDownload = async () => {
        const data = logs.reduce((acc, log) => {
            const {
                Time,
                Description,
                Status,
                User,
                IP,
                Location,
                InternetProvider,
                AppVersion,
                Device,
                ProtectionDesc,
            } = log;

            const row = [
                fromUnixTime(Time).toISOString(),
                Description,
                Status || '',
                User?.Name || '',
                User?.Email || '',
                IP || '',
                Location || '',
                InternetProvider || '',
                AppVersion || '',
                Device || '',
            ];

            if (organization?.Settings?.HighSecurity === 1) {
                row.push(ProtectionDesc || '');
            }

            acc.push(row.map(escapeCsvValue).join(','));
            return acc;
        }, [
            [
                'Time',
                'Event',
                'Status',
                'User Name',
                'User Email',
                'IP',
                'Location',
                'InternetProvider',
                'AppVersion',
                'Device',
                'Protection',
            ].map(escapeCsvValue).join(','),
        ]);

        const filename = 'events.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });

        downloadFile(blob, filename);
    };

    return (
        organization.Settings.OrganizationPolicy.Enforced === 0 ? (
            <B2BOrganizationUpsellBanner organization={organization}/>
        ) : (
            <>
                <SettingsSectionWide customWidth="90em">
                    <ActivityMonitorDescription />
                    <div className="flex flex-row justify-space-between items-center mb-4">
                        <div className="flex *:min-size-auto flex-column gap-2">
                            <div className="flex flex-row flex-nowrap items-center gap-2">
                                <Toggle
                                    id="monitoring-toggle"
                                    loading={togglingMonitoringLoading}
                                    checked={monitoring}
                                    onChange={monitoring ? toggleMonitoring : setActivityMonitoring}
                                />
                                <span>
                                    {c('Info').t`Activity monitor`}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-row gap-2">
                            <Button
                                shape="outline"
                                className="self-end"
                                onClick={triggerReload}
                                loading={loadingDownload}
                                title={c('Action').t`Reload`}
                            >
                                <Icon name="arrow-rotate-right" className="mr-2" />
                                {c('Action').t`Reload`}
                            </Button>
                            <Button
                                shape="outline"
                                className="self-end"
                                onClick={() => withLoadingDownload(handleDownload())}
                                loading={loadingDownload}
                                title={c('Action').t`Export`}
                            >
                                <Icon name="arrow-down-line" className="mr-2" />
                                {c('Action').t`Export`}
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <AuthenticationLogs
                            organization={organization}
                            activityMonitorSection={true}
                            wipeLogs={wipeLogsFlag}
                            reloadTrigger={reloadTrigger}
                            monitoring={monitoring}
                            onLogsLoaded={setLogs}
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
