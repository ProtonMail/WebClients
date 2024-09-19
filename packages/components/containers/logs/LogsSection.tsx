import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import ConfirmModal from '@proton/components/components/modal/Confirm';
import Toggle from '@proton/components/components/toggle/Toggle';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { clearLogs, queryLogs } from '@proton/shared/lib/api/logs';
import { updateLogAuth } from '@proton/shared/lib/api/settings';
import type { AuthLog } from '@proton/shared/lib/authlog';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { wait } from '@proton/shared/lib/helpers/promise';
import { SETTINGS_LOG_AUTH_STATE } from '@proton/shared/lib/interfaces';

import { Pagination, usePaginationAsync } from '../../components';
import { useApi, useModals, useUserSettings } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import LogsTable from './LogsTable';
import WipeLogsButton from './WipeLogsButton';
import { getAllAuthenticationLogs } from './helper';

const { BASIC, DISABLE, ADVANCED } = SETTINGS_LOG_AUTH_STATE;

const INITIAL_STATE = {
    logs: [],
    total: 0,
};
const PAGE_SIZE = 10;

const LogsSection = () => {
    const isMounted = useIsMounted();
    const [settings] = useUserSettings();
    const { createModal } = useModals();
    const [logAuth, setLogAuth] = useState(settings.LogAuth);
    const protonSentinel = settings.HighSecurity.Value;
    const api = useApi();
    const [state, setState] = useState<{ logs: AuthLog[]; total: number }>(INITIAL_STATE);
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const [loading, withLoading] = useLoading();
    const [loadingRefresh, withLoadingRefresh] = useLoading();
    const [loadingDownload, withLoadingDownload] = useLoading();
    const [loadingWipe, withLoadingWipe] = useLoading();
    const [error, setError] = useState(false);

    const handleWipe = async () => {
        await withLoadingWipe(api(clearLogs()));
        setState(INITIAL_STATE);
    };

    const handleDownload = async () => {
        const Logs = await getAllAuthenticationLogs(api);

        const data = Logs.reduce(
            (acc, { Description, Time, IP }) => {
                acc.push(`${Description},${fromUnixTime(Time).toISOString()},${IP}`);
                return acc;
            },
            [['Event', 'Time', 'IP'].join(',')]
        );

        const filename = 'logs.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });

        downloadFile(blob, filename);
    };

    const confirmDisable = () => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Clear`} onConfirm={resolve} onClose={reject}>
                    <Alert className="mb-4" type="warning">{c('Warning')
                        .t`By disabling security events monitoring, you will also clear your entire history. Are you sure you want to disable this?`}</Alert>
                </ConfirmModal>
            );
        });
    };

    const handleLogAuth = async (newLogAuthState: SETTINGS_LOG_AUTH_STATE) => {
        if (state.total > 0 && newLogAuthState === DISABLE) {
            await confirmDisable();
        }
        await api(updateLogAuth(newLogAuthState));
        setLogAuth(newLogAuthState);
        if (newLogAuthState === DISABLE) {
            setState(INITIAL_STATE);
        }
    };

    const handleLogsChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        handleLogAuth(checked ? BASIC : DISABLE);
    };

    const handleAdvancedLogsChange = ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => {
        handleLogAuth(checked ? ADVANCED : BASIC);
    };

    // Handle updates from the event manager
    useEffect(() => {
        setLogAuth(settings.LogAuth);
    }, [settings.LogAuth]);

    const latestRef = useRef<any>();

    const fetchAndSetState = async () => {
        const latest = {};
        latestRef.current = latest;

        setError(false);
        try {
            const { Logs, Total } = await api<{ Logs: AuthLog[]; Total: number }>(
                queryLogs({
                    Page: page - 1,
                    PageSize: 10,
                })
            );
            if (latestRef.current !== latest) {
                return;
            }
            if (isMounted()) {
                setState({ logs: Logs, total: Total });
            }
        } catch (e: any) {
            if (latestRef.current !== latest) {
                return;
            }
            if (isMounted()) {
                setError(true);
            }
        }
    };

    const handleWipeWithReload = async () => {
        await withLoadingWipe(handleWipe());
        await withLoadingRefresh(fetchAndSetState);
    };

    useEffect(() => {
        withLoading(fetchAndSetState());
    }, [page, protonSentinel]);

    const BRAND_NAME_TWO = BRAND_NAME;

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`Events include authentication attempts for all ${BRAND_NAME} services that use your ${BRAND_NAME_TWO} credentials.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="logs-toggle">
                        {c('Log preference').t`Enable security events`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <Toggle
                        id="logs-toggle"
                        checked={logAuth === BASIC || logAuth === ADVANCED}
                        onChange={handleLogsChange}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>

            {logAuth !== DISABLE && (
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="text-semibold" htmlFor="advanced-logs-toggle">
                            <span className="mr-2">{c('Log preference').t`Enable detailed events`}</span>
                            <Info
                                title={c('Tooltip').t`Enabling detailed events records the IP address for each event.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer>
                        <Toggle
                            id="advanced-logs-toggle"
                            checked={logAuth === ADVANCED}
                            onChange={handleAdvancedLogsChange}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}

            <div className="flex justify-space-between items-start mt-8 mb-4">
                {logAuth !== DISABLE && (
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

                        {state.logs.length ? (
                            <WipeLogsButton className="mr-4" onWipe={handleWipeWithReload} loading={loadingWipe} />
                        ) : null}
                        {state.logs.length ? (
                            <Button
                                shape="outline"
                                className="mr-4"
                                onClick={() => withLoadingDownload(handleDownload())}
                                loading={loadingDownload}
                            >{c('Action').t`Download`}</Button>
                        ) : null}
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
                logAuth={logAuth}
                protonSentinel={protonSentinel}
                loading={loading || loadingRefresh}
                error={error}
            />
        </SettingsSectionWide>
    );
};

export default LogsSection;
