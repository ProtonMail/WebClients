import _ from 'lodash';
import updateCollection from '../../utils/helpers/updateCollection';

import { FREE_USER_ROLE, PAID_ADMIN_ROLE, PAID_MEMBER_ROLE, STATUS } from '../../constants';

/* @ngInject */
function memberModel(dispatchers, addressesModel, memberApi, gettextCatalog, authentication, formatKeys) {
    let CACHE = [];
    const { dispatcher, on } = dispatchers(['members']);
    const I18N = {
        ROLES: {
            [PAID_ADMIN_ROLE]: gettextCatalog.getString('Admin', null, 'User role'),
            [PAID_MEMBER_ROLE]: gettextCatalog.getString('Member', null, 'User role')
        }
    };

    const USER_MEMBER = { Self: 1 };

    const get = () => CACHE;
    const clear = () => (CACHE.length = 0);
    const set = (list = []) => (clear(), CACHE.push(...list));

    const remove = ({ ID }) => memberApi.remove(ID);
    const changeRole = ({ ID }, payload) => memberApi.role(ID, payload);
    const makePrivate = ({ ID }) => memberApi.privatize(ID);
    const login = ({ ID }, params) => memberApi.authenticate(ID, params);
    const formatUserMember = () => {
        _.extend(USER_MEMBER, {
            Name: authentication.user.Name,
            Addresses: addressesModel.get(),
            UsedSpace: authentication.user.UsedSpace,
            MaxSpace: authentication.user.MaxSpace
        });
    };

    const fetchAddresses = async (member) => {
        const { data = {} } = await memberApi.addresses(member.ID);
        const { Addresses = [] } = data;

        member.Addresses = await formatKeys(Addresses);

        return member;
    };

    const fetch = async () => {
        formatUserMember();
        const { Members = [] } = await memberApi.query();
        const members = await Promise.all(Members.map(fetchAddresses));

        set(expandSelfMember(members));

        return get();
    };

    function expandSelfMember(members = []) {
        return _.map(members, (member) => {
            member.toggle = member.Self === 1;
            return member;
        });
    }

    function getUser() {
        formatUserMember();
        return [USER_MEMBER];
    }

    function getAll() {
        const members = authentication.user.Role === FREE_USER_ROLE ? getUser() : get();
        return expandSelfMember(members);
    }

    const getNonPrivate = () => _.filter(getAll(), ({ Private }) => Private === 0);
    const getSelf = () => _.find(getAll(), ({ Self }) => Self === 1);
    const hasAdmins = () => _.some(getAll(), ({ Role }) => Role === PAID_ADMIN_ROLE);
    const getRoles = () => angular.copy(I18N.ROLES);

    /**
     * Refresh the cache based on the eventManager
     * Dispatch an event update at the end of the process
     * @param  {Array}  members List of updates relative to members
     * @return {void}
     */
    const manageCache = async (members = []) => {
        const { collection, todo } = updateCollection(CACHE, members, 'Member');
        const toFetch = [].concat(todo.create, todo.update).map(({ ID }) => ID);
        const fullMembers = await Promise.all(
            collection.map((member) => {
                if (toFetch.includes(member.ID)) {
                    return fetchAddresses(member);
                }
                return member;
            })
        );

        CACHE = _.sortBy(fullMembers, 'Name');

        dispatcher.members('update', {
            list: CACHE,
            operations
        });
    };

    const isMember = () => authentication.user.Role === PAID_MEMBER_ROLE;

    on('app.event', (e, { type, data = {} }) => {
        type === 'members' && manageCache(data);
    });

    on('logout', () => {
        clear();
    });

    return {
        get,
        set,
        fetch,
        clear,
        remove,
        changeRole,
        makePrivate,
        login,
        getAll,
        getNonPrivate,
        hasAdmins,
        getSelf,
        getRoles,
        isMember
    };
}
export default memberModel;
