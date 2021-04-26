import React, { useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { fromUnixTime } from 'date-fns';
import { clearLogs, queryLogs } from 'proton-shared/lib/api/logs';
import { updateLogAuth } from 'proton-shared/lib/api/settings';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { SETTINGS_LOG_AUTH_STATE } from 'proton-shared/lib/interfaces';
import { wait } from 'proton-shared/lib/helpers/promise';
import { AuthLog, getAuthLogEventsI18N } from 'proton-shared/lib/authlog';
import { Alert, Button, ConfirmModal, Icon, Info, Pagination, Toggle, usePaginationAsync } from '../../components';
import { useApi, useLoading, useModals, useUserSettings } from '../../hooks';

import LogsTable from './LogsTable';
import WipeLogsButton from './WipeLogsButton';
import { getAllAuthenticationLogs } from './helper';
import { SettingsParagraph, SettingsSection } from '../account';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

const { BASIC, DISABLE, ADVANCED } = SETTINGS_LOG_AUTH_STATE;

const INITIAL_STATE = {
    logs: [],
    total: 0,
};
const PAGE_SIZE = 10;

const LogsSection = () => {
    const [settings] = useUserSettings();
    const { createModal } = useModals();
    const [logAuth, setLogAuth] = useState(settings.LogAuth);
    const api = useApi();
    const [state, setState] = useState<{ logs: AuthLog[]; total: number }>(INITIAL_STATE);
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const [loading, withLoading] = useLoading();
    const [loadingRefresh, withLoadingRefresh] = useLoading();
    const [loadingDownload, withLoadingDownload] = useLoading();
    const [error, setError] = useState(false);

    const handleWipe = async () => {
        await api(clearLogs());
        setState(INITIAL_STATE);
    };

    const handleDownload = async () => {
        const Logs = await getAllAuthenticationLogs(api);

        const data = Logs.reduce(
            (acc, { Event, Time, IP }) => {
                acc.push(`${getAuthLogEventsI18N(Event)},${fromUnixTime(Time).toISOString()},${IP}`);
                return acc;
            },
            [['Event', 'Time', 'IP'].join(',')]
        );

        const filename = 'logs.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        downloadFile(blob, filename);
    };

    const confirmDisable = () => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Clear`} onConfirm={resolve} onClose={reject}>
                    <Alert type="warning">{c('Warning')
                        .t`By disabling the logs, you will also clear your entire logs history. Are you sure you want to disable the logs?`}</Alert>
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

    const handleLogsChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
        handleLogAuth(checked ? BASIC : DISABLE);
    };

    const handleAdvancedLogsChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
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
            setState({ logs: Logs, total: Total });
        } catch (e) {
            if (latestRef.current !== latest) {
                return;
            }
            setError(true);
        }
    };

    useEffect(() => {
        withLoading(fetchAndSetState());
    }, [page]);

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`Logs include authentication attempts for all Proton services that use your Proton credentials.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="text-semibold" htmlFor="logs-toggle">
                        {c('Log preference').t`Enable authentication logs`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="pt0-5">
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
                            <span className="mr0-5">{c('Log preference').t`Enable advanced logs`}</span>
                            <Info
                                title={c('Tooltip')
                                    .t`Enabling advanced logs records the IP address for each event in the security log.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="pt0-5">
                        <Toggle
                            id="advanced-logs-toggle"
                            checked={logAuth === ADVANCED}
                            onChange={handleAdvancedLogsChange}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}

            <div className="flex flex-justify-space-between flex-align-items-start mt2 mb1">
                {logAuth !== DISABLE && (
                    <div className="on-mobile-mb1">
                        <Button
                            shape="outline"
                            className="mr1 inline-flex flex-align-items-center"
                            loading={loadingRefresh}
                            onClick={() => withLoadingRefresh(wait(1000).then(fetchAndSetState))}
                            title={c('Action').t`Reload`}
                        >
                            <Icon name="reload" className="mr0-5" />
                            <span>{c('Action').t`Reload`}</span>
                        </Button>

                        {state.logs.length ? <WipeLogsButton className="mr1" onWipe={handleWipe} /> : null}
                        {state.logs.length ? (
                            <Button
                                shape="outline"
                                className="mr1"
                                onClick={() => withLoadingDownload(handleDownload())}
                                loading={loadingDownload}
                            >{c('Action').t`Download`}</Button>
                        ) : null}
                    </div>
                )}

                <div>
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

            <LogsTable logs={state.logs} logAuth={logAuth} loading={loading} error={error} />
        </SettingsSection>
    );
};

export default LogsSection;
