/* @ngInject */
function activeSessionsModel($filter, authApi, authentication, dispatchers, gettextCatalog, memberModel, userType) {
    const { on, dispatcher } = dispatchers(['activeSessions']);
    const I18N = {
        createTime(date) {
            return gettextCatalog.getString('Created since {{ date }}', { date }, 'Tooltip display per session');
        }
    };
    const sessions = [];
    const get = () => sessions;
    const clear = () => (sessions.length = 0);
    const clients = {
        Web: 'ProtonMail Web App',
        iOS: 'ProtonMail iOS',
        Android: 'ProtonMail Android',
        ImportExport: 'ProtonMail Import-Export',
        Bridge: 'ProtonMail Bridge',
        WebVPN: 'ProtonVPN Web App',
        VPN: 'ProtonVPN',
        macOSVPN: 'ProtonVPN macOS',
        iOSVPN: 'ProtonVPN iOS',
        AndroidVPN: 'ProtonVPN Android',
        Admin: 'Admin'
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
            session.username = isAdmin ? members[session.MemberID].Name : authentication.user.Name;
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
