import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    Button,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    Time,
    LearnMore,
    Pagination,
    Alert,
    Block,
    SubTitle,
    ConfirmModal,
    useModal,
    useLoading,
    usePagination
} from 'react-components';
import useApi from '../../hooks/useApi';
import { querySessions, revokeOtherSessions, revokeSession } from 'proton-shared/lib/api/auth';
import { ELEMENTS_PER_PAGE } from 'proton-shared/lib/constants';

import SessionAction from './SessionAction';
import useAuthenticationStore from '../../hooks/useAuthenticationStore';

const CLIENTS = {
    Web: c('Badge').t`ProtonMail for web`,
    iOS: c('Badge').t`ProtonMail for iOS`,
    Android: c('Badge').t`ProtonMail for Android`,
    ImportExport: c('Badge').t`ProtonMail Import-Export`,
    Bridge: c('Badge').t`ProtonMail Bridge`,
    WebVPN: c('Badge').t`ProtonVPN for web`,
    VPN: c('Badge').t`ProtonVPN for Windows`,
    macOSVPN: c('Badge').t`ProtonVPN for macOS`,
    iOSVPN: c('Badge').t`ProtonVPN for iOS`,
    AndroidVPN: c('Badge').t`ProtonVPN for Android`,
    Admin: c('Badge').t`Admin`
};

const SessionsSection = () => {
    const api = useApi();
    const authenticationStore = useAuthenticationStore();
    const { loading, loaded } = useLoading();
    const [table, setTable] = useState({ sessions: [], total: 0 });
    const { page, list, onNext, onPrevious, onSelect } = usePagination(table.sessions);
    const { isOpen: showConfirmRevokeAll, open: openConfirmRevokeAll, close: closeConfirmRevokeAll } = useModal();
    const currentUID = authenticationStore.getUID();
    const fetchSessions = async () => {
        const { Sessions } = await api(querySessions());
        setTable({ sessions: Sessions.reverse(), total: Sessions.length }); // Most recent, first
        loaded();
    };

    const handleRevoke = (UID) => async () => {
        await api(UID ? revokeSession(UID) : revokeOtherSessions());
        fetchSessions();
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return (
        <>
            <SubTitle>{c('Title').t`Sessions`}</SubTitle>
            <Alert>{c('Info')
                .t`Unless you explicitly logout or change your password, sessions can last for up to 6 months. Sessions expire after 2 weeks of inactivity.`}</Alert>
            <Block className="flex flex-spacebetween">
                <div>
                    <Button onClick={openConfirmRevokeAll}>{c('Action').t`Revoke all other sessions`}</Button>
                    <ConfirmModal show={showConfirmRevokeAll} onClose={closeConfirmRevokeAll} onConfirm={handleRevoke}>
                        <Alert>{c('Info').t`Do you want to revoke all other sessions than the current one?`}</Alert>
                    </ConfirmModal>
                    <LearnMore url="https://protonmail.com/support/knowledge-base/log-out-all-other-sessions/" />
                </div>
                <Pagination
                    page={page}
                    total={table.total}
                    limit={ELEMENTS_PER_PAGE}
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect}
                />
            </Block>
            <Table>
                <TableHeader cells={[c('Title').t`Service`, c('Title').t`Time`, c('Title').t`Action`]} />
                <TableBody loading={loading} colSpan={3}>
                    {list.map((session) => {
                        const key = session.UID;
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    CLIENTS[session.ClientID],
                                    <Time format="LLL" key={key}>
                                        {session.CreateTime}
                                    </Time>,
                                    <SessionAction
                                        key={key}
                                        session={session}
                                        currentUID={currentUID}
                                        onRevoke={handleRevoke(session.UID)}
                                    />
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
