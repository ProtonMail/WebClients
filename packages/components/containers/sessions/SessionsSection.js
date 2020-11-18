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

const getClientsI18N = () => ({
    Web: c('Badge').t`ProtonMail for web`,
    VPN: c('Badge').t`ProtonVPN for Windows`,
    WebVPN: c('Badge').t`ProtonVPN for web`,
    Admin: c('Badge').t`Admin`,
    ImportExport: c('Badge').t`ProtonMail Import-Export`,
    Bridge: c('Badge').t`ProtonMail Bridge`,
    iOS: c('Badge').t`ProtonMail for iOS`,
    Android: c('Badge').t`ProtonMail for Android`,
    WebAccount: c('Badge').t`Proton Account for web`,
    WebMail: c('Badge').t`ProtonMail for web`,
    WebMailSettings: c('Badge').t`ProtonMail settings for web`,
    WebContacts: c('Badge').t`ProtonContacts for web`,
    WebVPNSettings: c('Badge').t`ProtonVPN settings for web`,
    WebCalendar: c('Badge').t`ProtonCalendar for web`,
    WebDrive: c('Badge').t`ProtonDrive for web`,
    // WebWallet: c('Badge').t`ProtonWallet for web`,
    WebAdmin: c('Badge').t`Admin`,
    iOSMail: c('Badge').t`ProtonMail for iOS`,
    iOSVPN: c('Badge').t`ProtonVPN for iOS`,
    iOSCalendar: c('Badge').t`ProtonCalendar for iOS`,
    AndroidMail: c('Badge').t`ProtonMail for Android`,
    AndroidVPN: c('Badge').t`ProtonVPN for Android`,
    AndroidTvVPN: c('Badge').t`ProtonVPN for Android TV`,
    AndroidCalendar: c('Badge').t`ProtonCalendar for Android`,
    WindowsVPN: c('Badge').t`ProtonVPN for Windows`,
    WindowsImportExport: c('Badge').t`ProtonMail Import-Export for Windows`,
    WindowsBridge: c('Badge').t`ProtonMail Bridge for Windows`,
    macOSVPN: c('Badge').t`ProtonVPN for macOS`,
    macOSImportExport: c('Badge').t`ProtonMail Import-Export for macOS`,
    macOSBridge: c('Badge').t`ProtonMail Bridge for macOS`,
    LinuxImportExport: c('Badge').t`ProtonMail Import-Export for GNU/Linux`,
    LinuxBridge: c('Badge').t`ProtonMail Bridge for GNU/Linux`,
    LinuxVPN: c('Badge').t`ProtonVPN for GNU/Linux`,
});

const SessionsSection = () => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const authentication = useAuthentication();
    const [loading, withLoading] = useLoading();
    const [table, setTable] = useState({ sessions: [], total: 0 });
    const { page, list, onNext, onPrevious, onSelect } = usePagination(table.sessions);
    const { createModal } = useModals();

    const fetchSessions = async () => {
        const { Sessions } = await api(querySessions());
        setTable({ sessions: Sessions.reverse(), total: Sessions.length }); // Most recent, first
    };

    const handleRevoke = async (UID) => {
        await api(UID ? revokeSession(UID) : revokeOtherSessions());
        await fetchSessions();
        createNotification({ text: UID ? c('Success').t`Session revoked` : c('Success').t`Sessions revoked` });
    };

    const handleOpenModal = () => {
        createModal(
            <ConfirmModal onConfirm={() => withLoading(handleRevoke())}>
                <Alert>{c('Info').t`Do you want to revoke all other sessions than the current one?`}</Alert>
            </ConfirmModal>
        );
    };

    useEffect(() => {
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
                    <Button onClick={handleOpenModal}>{c('Action').t`Revoke all other sessions`}</Button>
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
                                        onRevoke={
                                            session.Revocable ? () => withLoading(handleRevoke(session.UID)) : undefined
                                        }
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
