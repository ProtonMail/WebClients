import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import useIsMounted from '@proton/hooks/useIsMounted';
import { querySessions, revokeOtherSessions, revokeSession } from '@proton/shared/lib/api/auth';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import {
    Pagination,
    Prompt,
    Table,
    TableBody,
    TableHeader,
    TableRow,
    Time,
    useModalState,
    usePagination,
} from '../../components';
import { useApi, useAuthentication, useNotifications } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import SessionAction from './SessionAction';
import { Session } from './interface';

const PAGE_SIZE = 10;

const SessionsSection = () => {
    const { createNotification } = useNotifications();
    const isMounted = useIsMounted();
    const api = useApi();
    const authentication = useAuthentication();
    const [confirmProps, setConfirm, renderConfirm] = useModalState();
    const [loading, withLoading] = useLoading();
    const [loadingRevokeAll, withLoadingRevokeAll] = useLoading();
    const [state, setState] = useState<{ sessions: Session[]; total: number }>({ sessions: [], total: 0 });
    const { page, list, onNext, onPrevious, onSelect } = usePagination(state.sessions, 1, PAGE_SIZE);

    const handleRevoke = async (UID: string) => {
        await api(revokeSession(UID));
        setState(({ sessions }) => {
            const newSessions = sessions.filter(({ UID: otherUID }) => UID !== otherUID);
            return {
                sessions: newSessions,
                total: sessions.length,
            };
        });
        createNotification({ text: c('Success').t`Session revoked` });
    };

    const handleRevokeAllSessions = async () => {
        await api(revokeOtherSessions());
        const selfUID = authentication.getUID();
        setState(({ sessions }) => {
            const newSessions = sessions.filter(({ UID: otherUID }) => selfUID === otherUID);
            return {
                sessions: newSessions,
                total: sessions.length,
            };
        });
        createNotification({ text: c('Success').t`Sessions revoked` });
    };

    useEffect(() => {
        const fetchSessions = async () => {
            const { Sessions } = await api<{ Sessions: Session[] }>(querySessions());
            if (isMounted()) {
                setState({ sessions: Sessions.reverse(), total: Sessions.length }); // Most recent, first
            }
        };
        withLoading(fetchSessions()).catch(noop);
    }, []);

    const currentUID = authentication.getUID();

    return (
        <>
            {renderConfirm && (
                <Prompt
                    {...confirmProps}
                    title={c('Action').t`Revoke all other sessions`}
                    buttons={[
                        <Button
                            color="norm"
                            onClick={() => {
                                withLoadingRevokeAll(handleRevokeAllSessions()).catch(noop);
                                confirmProps.onClose();
                            }}
                        >
                            {c('Action').t`Revoke all other sessions`}
                        </Button>,
                        <Button onClick={confirmProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    {c('Info').t`Do you want to revoke all other sessions than the current one?`}
                </Prompt>
            )}
            <SettingsSectionWide>
                <SettingsParagraph learnMoreUrl={getKnowledgeBaseUrl('/log-out-all-other-sessions')}>
                    {c('Info')
                        .t`Unless you sign out of your account or change your password, your session will remain active. Sessions expire after 60 days of inactivity.`}
                </SettingsParagraph>
                <div className="flex flex-justify-space-between flex-align-items-start mb-4">
                    <div className="mb-4 md:mb-0">
                        <Button shape="outline" onClick={() => setConfirm(true)} loading={loadingRevokeAll}>
                            {c('Action').t`Revoke all other sessions`}
                        </Button>
                    </div>
                    <Pagination
                        page={page}
                        total={state.total}
                        limit={PAGE_SIZE}
                        onNext={onNext}
                        onPrevious={onPrevious}
                        onSelect={onSelect}
                    />
                </div>
                <Table hasActions responsive="cards">
                    <TableHeader cells={[c('Title').t`App`, c('Title').t`Date`, c('Title').t`Action`]} />
                    <TableBody loading={loading} colSpan={3}>
                        {list.map((session) => {
                            const key = session.UID;
                            return (
                                <TableRow
                                    key={key}
                                    labels={[c('Title').t`App`, c('Title').t`Date`, '']}
                                    cells={[
                                        session.LocalizedClientName,
                                        <Time format="PPp" key={1}>
                                            {session.CreateTime}
                                        </Time>,
                                        <SessionAction
                                            key={2}
                                            session={session}
                                            currentUID={currentUID}
                                            onRevoke={session.Revocable ? () => handleRevoke(session.UID) : undefined}
                                        />,
                                    ]}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </SettingsSectionWide>
        </>
    );
};

export default SessionsSection;
