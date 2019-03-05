import React, { useState, useEffect, useContext } from 'react';
import { t } from 'ttag';
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
import ContextApi from 'proton-shared/lib/context/api';
import { querySessions, revokeOtherSessions, revokeSession } from 'proton-shared/lib/api/auth';
import { ELEMENTS_PER_PAGE } from 'proton-shared/lib/constants';

import SessionAction from './SessionAction';

const CLIENTS = {
    Web: t`ProtonMail for web`,
    iOS: t`ProtonMail for iOS`,
    Android: t`ProtonMail for Android`,
    ImportExport: t`ProtonMail Import-Export`,
    Bridge: t`ProtonMail Bridge`,
    WebVPN: t`ProtonVPN for web`,
    VPN: t`ProtonVPN for Windows`,
    macOSVPN: t`ProtonVPN for macOS`,
    iOSVPN: t`ProtonVPN for iOS`,
    AndroidVPN: t`ProtonVPN for Android`,
    Admin: t`Admin`
};

const SessionsSection = () => {
    const { api, authenticationStore } = useContext(ContextApi);
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
            <SubTitle>{t`Sessions`}</SubTitle>
            <Alert>{t`Unless you explicitly logout or change your password, sessions can last for up to 6 months. Sessions expire after 2 weeks of inactivity.`}</Alert>
            <Block className="flex flex-spacebetween">
                <div>
                    <Button onClick={openConfirmRevokeAll}>{t`Revoke all other sessions`}</Button>
                    <ConfirmModal show={showConfirmRevokeAll} onClose={closeConfirmRevokeAll} onConfirm={handleRevoke}>
                        <Alert>{t`Do you want to revoke all other sessions than the current one?`}</Alert>
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
                <TableHeader cells={[t`Service`, t`Time`, t`Action`]} />
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
