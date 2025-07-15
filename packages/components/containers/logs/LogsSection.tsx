import { type ChangeEvent, useEffect, useRef, useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import Pagination from '@proton/components/components/pagination/Pagination';
import usePaginationAsync from '@proton/components/components/pagination/usePaginationAsync';
import Prompt from '@proton/components/components/prompt/Prompt';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { escapeCsvValue } from '@proton/components/helpers/escapeCsvValue';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { clearLogs, queryLogs } from '@proton/shared/lib/api/logs';
import { updateLogAuth } from '@proton/shared/lib/api/settings';
import { type AuthLog } from '@proton/shared/lib/authlog';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { wait } from '@proton/shared/lib/helpers/promise';
import { SETTINGS_LOG_AUTH_STATE } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import LogsTable from './LogsTable';
import WipeLogsButton from './WipeLogsButton';
import { getAllAuthenticationLogs } from './helper';
import { useOrganization } from '@proton/account/organization/hooks';

const INITIAL_STATE = {
    logs: [],
    total: 0,
};
const PAGE_SIZE = 10;

const LogsSection = () => {
    const isMounted = useIsMounted();
    const [settings] = useUserSettings();
    const [organization] = useOrganization();
    const protonSentinel = settings.HighSecurity.Value;
    const api = useApi();
    const [basicLogAuth, setBasicLogAuth] = useState(settings.LogAuth);
    const [state, setState] = useState<{ logs: AuthLog[]; total: number }>(INITIAL_STATE);
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const [loading, withLoading] = useLoading();
    const [loadingRefresh, withLoadingRefresh] = useLoading();
    const [loadingDownload, withLoadingDownload] = useLoading();
    const [error, setError] = useState(false);
    const [loadingWipe, withLoadingWipe] = useLoading();
    const [confirmModal, showConfirmModal] = useModalTwoPromise();

    const hasB2BLogs = Boolean(settings?.OrganizationPolicy?.Enforced);
    const { ADVANCED, BASIC, DISABLE } = SETTINGS_LOG_AUTH_STATE;

    const handleDownload = async () => {
        const Logs = await getAllAuthenticationLogs(api);

        const data = Logs.reduce(
            (acc, log) => {
                const { Time, IP, AppVersion, Device, Description, Location, Status, ProtectionDesc, InternetProvider } = log;

                const row = [
                    fromUnixTime(Time).toISOString(),
                    Description,
                    Status,
                    IP,
                    Location,
                    InternetProvider,
                    AppVersion,
                    Device,
                ];

                if (protonSentinel === 1) {
                    row.push(ProtectionDesc);
                }

                acc.push(row.map(escapeCsvValue).join(','));
                return acc;
            },
            [
                ['Time', 'Event', 'Status', 'IP', 'Location', 'InternetProvider', 'AppVersion', 'Device', 'Protection']
                    .map(escapeCsvValue)
                    .join(','),
            ]
        );

        const filename = 'events.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });

        downloadFile(blob, filename);
    };

    const latestRef = useRef<any>();

    const fetchAndSetState = async () => {
        const latest = {};
        latestRef.current = latest;

        try {
            const { Logs, Total } = await api<{ Logs: AuthLog[]; Total: number }>(
                queryLogs({
                    Page: page - 1,
                    PageSize: 10,
                })
            );
            setState({ logs: Logs, total: Total });
        } catch (e: any) {
            if (latestRef.current !== latest) {
                return;
            }
            if (isMounted()) {
                setError(true);
            }
        }
    };

    const handleWipe = async () => {
        await withLoadingWipe(api(clearLogs()));
        setState(INITIAL_STATE);
    };

    const handleWipeWithReload = async () => {
        await withLoadingWipe(handleWipe());
        await withLoadingRefresh(fetchAndSetState);
    };

    const handleLogAuth = async (newLogAuthState: SETTINGS_LOG_AUTH_STATE) => {
        if (state.total > 0 && newLogAuthState === DISABLE) {
            await showConfirmModal();
        }
        await api(updateLogAuth(newLogAuthState));
        setBasicLogAuth(newLogAuthState);
        if (newLogAuthState === DISABLE) {
            setState(INITIAL_STATE);
        }
    };

    const handleLogsChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        handleLogAuth(checked ? BASIC : DISABLE).catch(noop);
    };

    const handleAdvancedLogsChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        handleLogAuth(checked ? ADVANCED : BASIC).catch(noop);
    };

    useEffect(() => {
        withLoading(fetchAndSetState());
    }, [page, protonSentinel]);

    return (
        <>
            {confirmModal((props) => {
                return (
                    <Prompt
                        {...props}
                        onClose={() => props.onReject()}
                        title={c('Action').t`Disable security events`}
                        buttons={[
                            <Button color="norm" onClick={() => props.onResolve()}>
                                {c('Action').t`Disable security events`}
                            </Button>,
                            <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>,
                        ]}
                    >
                        {c('Info')
                            .t`By disabling security events monitoring, you will also clear your entire history. Are you sure you want to disable this?`}
                    </Prompt>
                );
            })}
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info')
                        .t`Monitor and audit authentication attempts for all ${BRAND_NAME} services that use your ${BRAND_NAME} credentials.`}
                </SettingsParagraph>

                {!hasB2BLogs && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="text-semibold" htmlFor="logs-toggle">
                                {c('Log preference').t`Activity monitor`}
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight isToggleContainer>
                            <Toggle
                                id="logs-toggle"
                                checked={basicLogAuth === BASIC || basicLogAuth === ADVANCED}
                                onChange={handleLogsChange}
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}

                {!hasB2BLogs && basicLogAuth !== DISABLE && (
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label className="text-semibold" htmlFor="advanced-logs-toggle">
                                <span className="mr-2">{c('Log preference').t`Enable detailed events`}</span>
                                <Info
                                    title={c('Tooltip')
                                        .t`Enabling detailed events records the IP address for each event.`}
                                />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight isToggleContainer>
                            <Toggle
                                id="advanced-logs-toggle"
                                checked={basicLogAuth === ADVANCED}
                                onChange={handleAdvancedLogsChange}
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                )}

                <div className="flex justify-space-between items-start mt-8 mb-4">
                    {basicLogAuth !== SETTINGS_LOG_AUTH_STATE.DISABLE && (
                        <div className="mb-2">
                            <Button
                                shape="outline"
                                className="mr-4 inline-flex items-center"
                                loading={loadingRefresh}
                                onClick={() => withLoadingRefresh(wait(1000).then(fetchAndSetState))}
                                title={c('Action').t`Reload`}
                            >
                                <Icon name="arrow-rotate-right" className="mr-2" />
                                <span>{c('Action').t`Reload`}</span>
                            </Button>
                            {!hasB2BLogs && state.logs.length > 0 && (
                                <>
                                    <WipeLogsButton
                                        className="mr-4"
                                        onWipe={handleWipeWithReload}
                                        loading={loadingWipe}
                                    />
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
                                </>
                            )}
                        </div>
                    )}

                    <div className="mb-2">
                        <Pagination
                            onNext={onNext}
                            onPrevious={onPrevious}
                            onSelect={onSelect}
                            total={state.total}
                            page={page}
                            limit={PAGE_SIZE}
                        />
                    </div>
                </div>
                <LogsTable
                    logs={state.logs}
                    logAuth={hasB2BLogs ? (organization?.Settings.LogAuth || 0) : basicLogAuth}
                    protonSentinel={hasB2BLogs && false ? (organization?.Settings.HighSecurity || 0) : protonSentinel}
                    loading={loading || loadingRefresh}
                    error={error}
                />
            </SettingsSectionWide>
        </>
    );
};

export default LogsSection;
