import { useEffect, useRef, useState } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import Pagination from '@proton/components/components/pagination/Pagination';
import usePaginationAsync from '@proton/components/components/pagination/usePaginationAsync';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { getOrgAuthLogs } from '@proton/shared/lib/api/b2bevents';
import { queryLogs } from '@proton/shared/lib/api/logs';
import type { AuthLog, B2BAuthLog } from '@proton/shared/lib/authlog';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { wait } from '@proton/shared/lib/helpers/promise';
import { SETTINGS_LOG_AUTH_STATE } from '@proton/shared/lib/interfaces';

import { getFormattedQueryString } from '../organization/useOrgAuthLogs';
import B2BAuthLogsTable from './B2BAuthLogsTable';
import LogsTable from './LogsTable';
import { getAllAuthenticationLogs } from './helper';

const INITIAL_STATE = {
    logs: [],
    total: 0,
};
const PAGE_SIZE = 10;

const LogsSection = () => {
    const isMounted = useIsMounted();
    const [settings] = useUserSettings();
    const [organization] = useOrganization();
    const [user] = useUser();
    const [logAuth, setLogAuth] = useState(0);
    const protonSentinel = settings.HighSecurity.Value;
    const api = useApi();
    const [b2bState, setB2bState] = useState<{ logs: B2BAuthLog[]; total: number }>(INITIAL_STATE);
    const [state, setState] = useState<{ logs: AuthLog[]; total: number }>(INITIAL_STATE);
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const [loading, withLoading] = useLoading();
    const [loadingRefresh, withLoadingRefresh] = useLoading();
    const [loadingDownload, withLoadingDownload] = useLoading();
    const [, withMonitoringInitializing] = useLoading();
    const [error, setError] = useState(false);

    useEffect(() => {
        void withMonitoringInitializing(
            new Promise(async (resolve) => {
                try {
                    if (organization?.Settings?.LogAuth === 2) {
                        setLogAuth(SETTINGS_LOG_AUTH_STATE.ADVANCED);
                    } else if (organization?.Settings?.LogAuth === 1) {
                        setLogAuth(SETTINGS_LOG_AUTH_STATE.BASIC);
                    } else if (organization?.Settings?.LogAuth === 0) {
                        setLogAuth(SETTINGS_LOG_AUTH_STATE.DISABLE);
                    }
                } catch (e) {
                    resolve();
                }
            })
        );
    }, []);

    const handleDownload = async () => {
        const Logs = await getAllAuthenticationLogs(api);

        const data = Logs.reduce(
            (acc, { Description, Time, IP }) => {
                acc.push(`${Description},${fromUnixTime(Time).toISOString()},${IP}`);
                return acc;
            },
            [['Event', 'Time', 'IP'].join(',')]
        );

        const filename = 'events.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });

        downloadFile(blob, filename);
    };

    // Handle updates from the event manager
    useEffect(() => {
        setLogAuth(settings.LogAuth);
    }, [settings.LogAuth]);

    const latestRef = useRef<any>();

    const fetchAndSetState = async () => {
        const latest = {};
        latestRef.current = latest;

        try {
            if (settings.OrganizationPolicy.Enforced === 1) {
                const query = {
                    Emails: [user.Email],
                };
                const queryString = getFormattedQueryString({ ...query, Page: page - 1, PageSize: 10 });
                const { Items, Total } = await api<{ Items: B2BAuthLog[]; Total: number }>(getOrgAuthLogs(queryString));
                if (latestRef.current !== latest) {
                    return;
                }
                if (isMounted()) {
                    const data = Items.map((item: any) => item.Data);
                    setB2bState({ logs: data, total: Total });
                }
            } else {
                const { Logs, Total } = await api<{ Logs: AuthLog[]; Total: number }>(
                    queryLogs({
                        Page: page - 1,
                        PageSize: 10,
                    })
                );
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

    useEffect(() => {
        withLoading(fetchAndSetState());
    }, [page, protonSentinel]);

    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('Info')
                    .t`Monitor and audit authentication attempts for all ${BRAND_NAME} services that use your ${BRAND_NAME} credentials.`}
            </SettingsParagraph>

            <div className="flex justify-space-between items-start mt-8 mb-4">
                {logAuth !== SETTINGS_LOG_AUTH_STATE.DISABLE && (
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

            {settings.OrganizationPolicy.Enforced === 1 ? (
                <B2BAuthLogsTable
                    logs={b2bState.logs}
                    userSection={true}
                    loading={loading || loadingRefresh}
                    detailedMonitoring={logAuth === SETTINGS_LOG_AUTH_STATE.ADVANCED}
                />
            ) : (
                <LogsTable
                    logs={state.logs}
                    logAuth={logAuth}
                    protonSentinel={protonSentinel}
                    loading={loading || loadingRefresh}
                    error={error}
                />
            )}
        </SettingsSectionWide>
    );
};

export default LogsSection;
