/* @ngInject */
function activeSessionsModel(authApi, authentication, dispatchers, memberModel, userType) {
    const { on, dispatcher } = dispatchers(['activeSessions']);
    const sessions = [];
    const get = () => sessions;
    const clear = () => (sessions.length = 0);
    const format = (newSessions = []) => {
        const { isAdmin } = userType();
        const members = memberModel.get().reduce((acc, member) => {
            acc[member.ID] = member;
            return acc;
        }, {});

        return newSessions.map((session) => {
            session.username = isAdmin ? members[session.MemberID].Name : authentication.user.Name;
            return session;
        });
    };
    const set = (newSessions = []) => {
        clear();
        sessions.push(...format(newSessions));
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
