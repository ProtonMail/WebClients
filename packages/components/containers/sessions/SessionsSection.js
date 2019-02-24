import React, { useState, useEffect, useContext } from 'react';
import { t } from 'ttag';
import { Badge, Button, SmallButton, Table, TableHeader, TableBody, TableRow, Time, LearnMore, Alert, Block, SubTitle, ConfirmModal, useModal, useLoading } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { querySessions, revokeOtherSessions, revokeSession } from 'proton-shared/lib/api/auth';

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
    const [sessions, setSessions] = useState([]);
    const { isOpen: showConfirmRevokeAll, open: openConfirmRevokeAll, close: closeConfirmRevokeAll } = useModal();
    const currentUID = authenticationStore.getUID();
    const fetchSessions = async () => {
        const { Sessions } = await api(querySessions());
        setSessions(Sessions.reverse()); // Most recent, first
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
            <Alert>{t`Unless you explicitly logout or change your password, sessions cans last for up to 6 months. Sessions expire after 2 weeks of inactivity.`}</Alert>
            <Block>
                <Button onClick={openConfirmRevokeAll}>{t`Revoke all other sessions`}</Button>
                <ConfirmModal show={showConfirmRevokeAll} onClose={closeConfirmRevokeAll} onConfirm={handleRevoke}>
                    <Alert>{t`Do you want to revoke all other sessions than the current one?`}</Alert>
                </ConfirmModal>
                <LearnMore url="https://protonmail.com/support/knowledge-base/log-out-all-other-sessions/" />
            </Block>
            <Table>
                <TableHeader cells={[
                    t`Service`,
                    t`Time`,
                    t`Action`,
                ]} />
                <TableBody loading={loading}>
                    {sessions.map(({ ClientID, CreateTime, UID }, index) => <TableRow key={index.toString()} cells={[
                        CLIENTS[ClientID],
                        <Time key={index.toString()}>{CreateTime}</Time>,
                        currentUID === UID ? <Badge>{t`Current session`}</Badge> : <SmallButton key={index.toString()} onClick={handleRevoke(UID)}>{t`Revoke`}</SmallButton>
                    ]} />)}
                </TableBody>
            </Table>
        </>
    );
};

export default SessionsSection;