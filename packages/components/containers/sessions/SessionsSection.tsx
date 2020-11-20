import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { querySessions, revokeOtherSessions, revokeSession } from 'proton-shared/lib/api/auth';
import { ELEMENTS_PER_PAGE } from 'proton-shared/lib/constants';
import {
    Button,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Time,
    Pagination,
    Alert,
    Block,
    ConfirmModal,
    usePagination,
} from '../../components';
import { useApi, useAuthentication, useModals, useLoading, useNotifications } from '../../hooks';

import SessionAction from './SessionAction';
import { Session } from './interface';
import { getClientsI18N } from './helper';

const SessionsSection = () => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const authentication = useAuthentication();
    const [loading, withLoading] = useLoading();
    const [loadingRevokeAll, withLoadingRevokeAll] = useLoading();
    const [state, setState] = useState<{ sessions: Session[]; total: number }>({ sessions: [], total: 0 });
    const { page, list, onNext, onPrevious, onSelect } = usePagination(state.sessions);
    const { createModal } = useModals();

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

    const handleOpenModal = () => {
        createModal(
            <ConfirmModal onConfirm={() => withLoadingRevokeAll(handleRevokeAllSessions())}>
                <Alert>{c('Info').t`Do you want to revoke all other sessions than the current one?`}</Alert>
            </ConfirmModal>
        );
    };

    useEffect(() => {
        const fetchSessions = async () => {
            const { Sessions } = await api<{ Sessions: Session[] }>(querySessions());
            setState({ sessions: Sessions.reverse(), total: Sessions.length }); // Most recent, first
        };
        withLoading(fetchSessions());
    }, []);

    const i18n = getClientsI18N();
    const currentUID = authentication.getUID();

    return (
        <>
            <Alert learnMore="https://protonmail.com/support/knowledge-base/log-out-all-other-sessions/">{c('Info')
                .t`Unless you explicitly sign out or change your password, sessions remain active and only expire after 30 days of inactivity.`}</Alert>
            <Block className="flex flex-spacebetween">
                <div>
                    <Button onClick={handleOpenModal} loading={loadingRevokeAll}>{c('Action')
                        .t`Revoke all other sessions`}</Button>
                </div>
                <Pagination
                    page={page}
                    total={state.total}
                    limit={ELEMENTS_PER_PAGE}
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect}
                />
            </Block>
            <Table>
                <TableHeader cells={[c('Title').t`App`, c('Title').t`Date`, c('Title').t`Action`]} />
                <TableBody loading={loading} colSpan={3}>
                    {list.map((session) => {
                        const key = session.UID;
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    i18n[session.ClientID],
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
        </>
    );
};

export default SessionsSection;
