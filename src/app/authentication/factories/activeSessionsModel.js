/* @ngInject */
function activeSessionsModel(
    $filter,
    authApi,
    authentication,
    dispatchers,
    gettextCatalog,
    memberModel,
    userType,
    translator
) {
    const { on, dispatcher } = dispatchers(['activeSessions']);
    const I18N = translator(() => ({
        createTime(date) {
            return gettextCatalog.getString('Created on {{ date }}', { date }, 'Tooltip display per session');
        }
    }));
    const sessions = [];
    const get = () => sessions;
    const clear = () => (sessions.length = 0);
    const clients = {
        Web: 'ProtonMail for web',
        VPN: 'ProtonVPN for Windows',
        WebVPN: 'ProtonVPN for web',
        Admin: 'Admin',
        ImportExport: 'ProtonMail Import-Export',
        Bridge: 'ProtonMail Bridge',
        Android: 'ProtonMail for Android',
        WebAccount: 'Proton Account for web',
        WebMail: 'ProtonMail for web',
        WebMailSettings: 'ProtonMail settings for web',
        WebContacts: 'ProtonContacts for web',
        WebVPNSettings: 'ProtonVPN settings for web',
        WebCalendar: 'ProtonCalendar for web',
        WebDrive: 'ProtonDrive for web',
        WebAdmin: 'Admin',
        iOS: 'ProtonMail for iOS',
        iOSDrive: 'ProtonDrive for iOS',
        iOSMail: 'ProtonMail for iOS',
        iOSVPN: 'ProtonVPN for iOS',
        iOSCalendar: 'ProtonCalendar for iOS',
        AndroidMail: 'ProtonMail for Android',
        AndroidVPN: 'ProtonVPN for Android',
        AndroidTvVPN: 'ProtonVPN for Android TV',
        AndroidCalendar: 'ProtonCalendar for Android',
        WindowsVPN: 'ProtonVPN for Windows',
        WindowsImportExport: 'ProtonMail Import-Export for Windows',
        WindowsBridge: 'ProtonMail Bridge for Windows',
        macOSVPN: 'ProtonVPN for macOS',
        macOSImportExport: 'ProtonMail Import-Export for macOS',
        macOSBridge: 'ProtonMail Bridge for macOS',
        LinuxImportExport: 'ProtonMail Import-Export for GNU/Linux',
        LinuxBridge: 'ProtonMail Bridge for GNU/Linux',
        LinuxVPN: 'ProtonVPN for GNU/Linux'
    };
    const format = (newSessions = []) => {
        const currentUID = authentication.getUID();
        const { isAdmin } = userType();
        const members = memberModel.get().reduce((acc, member) => {
            acc[member.ID] = member;
            return acc;
        }, {});

        return newSessions.map((session) => {
            session.isCurrentSession = session.UID === currentUID;
            session.client = clients[session.ClientID];
            session.createTime = I18N.createTime($filter('readableTime')(session.CreateTime));
            session.username = isAdmin && session.MemberID ? members[session.MemberID].Name : authentication.user.Name;

            return session;
        });
    };
    const set = (newSessions = []) => {
        clear();
        sessions.push(...format(newSessions.reverse())); // NOTE Most recent, first
        dispatcher.activeSessions('update', { sessions });
    };
    const fetch = async () => {
        const { data = {} } = await authApi.sessions();
        set(data.Sessions);
        return get();
    };
    const revoke = async (uid) => {
        await authApi.revokeSession(uid);
        await fetch();
    };
    const revokeOthers = async () => {
        await authApi.revokeOthers();
        await fetch();
    };

    on('logout', () => {
        clear();
    });

    return { get, clear, fetch, revoke, revokeOthers };
}

export default activeSessionsModel;
