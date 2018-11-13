import _ from 'lodash';
import { flow, filter, reduce } from 'lodash/fp';

/* @ngInject */
function recipientsFormator(contactGroupModel, composerContactGroupSelection, contactEmails) {
    /**
     * Get the list of contacts to use when we send an email to a group
     * This list can come from the user's selection via the modal
     * @param  {String} options.Address ID of the group
     * @param  {String} ID              Message's ID
     * @return {Array}
     */
    const getContactGroupList = async ({ Address }, ID) => {
        const cache = ID && composerContactGroupSelection(ID).get(Address);
        return cache || contactGroupModel.getExport(Address);
    };

    /**
     * Sync the cache with the list we can build when we save the message
     * @param  {Array} list  List inside a group (selectioon)
     * @param  {Object} cache
     */
    const syncSelection = (list, cache) => {
        Object.entries(_.groupBy(list, 'GroupID')).forEach(([ID, list]) => {
            cache.save({ ID }, _.uniqBy(list, 'Address'));
        });
    };

    /**
     * Create a MAP per group ID with emails coming from the contact API.
     * @param  {Object} map  {<groupID:string>: <emails:Array>}  (here emails are what the API returns)
     * @return {Object}      {<groupID:string>: <emails:Array>} here emails are more complete with Labels etc.
     */
    const mapCurrentGroupsEmails = (map = {}) => {
        return Object.keys(map).reduce((acc, ID) => {
            const list = _.map(map[ID], 'Address');
            acc[ID] = contactEmails.findEmails(list);
            return acc;
        }, Object.create(null));
    };

    /**
     * Get a list of recipients made by the composer/user
     * and format it to load all emails we have under a group if we find
     * groups.
     * Async because we need to fetch if the list of emails/group
     * @param  {Array}  list
     * @param  {String} ID   Message's ID
     * @param  {String}  key Type of list
     * @return {Promise}      Array
     */
    const formatInput = async (list = [], ID, key) => {
        if (!list.length) {
            return [];
        }

        const { emails, groups, map: MAP_GROUP, mapEmails: MAP_GROUP_EMAILS } = list.reduce(
            (acc, item) => {
                if (item.isContactGroup) {
                    acc.groups.push(getContactGroupList(item, ID));
                    acc.map[item.Address] = item;
                    acc.mapEmails[item.Address] = item.list;
                    return acc;
                }

                acc.emails.push(item);
                return acc;
            },
            { groups: [], emails: [], map: Object.create(null), mapEmails: Object.create(null) }
        );

        const items = await Promise.all(groups);
        const cache = composerContactGroupSelection(ID);
        const GROUP_EMAILS = mapCurrentGroupsEmails(MAP_GROUP_EMAILS);
        const listItems = _.flatten(items);

        /**
         * If you don't have any contacts anymore force using the list from the API
         * @return {Array}
         */
        const oldEmailGroupsList = _.flatten(_.values(MAP_GROUP_EMAILS)).filter(Boolean);
        const oldEmailsGroups = _.flatten(_.values(GROUP_EMAILS))
            .filter(({ Email }) => {
                return !listItems.some((item) => (item.Email || item.Address) === Email);
            })
            .map(({ Email, Address, Name }) => ({
                Name,
                Group: '',
                isContactGroup: false,
                Address: Email || Address
            }));

        // Get current the user selection when he tries to load an existing draft
        const draftList = cache.getDraftConfig(key);

        const { list: groupList, store } = flow(
            filter(({ LabelIDs, Email, Address }) => {
                if (!draftList || !LabelIDs) {
                    return true;
                }
                // Filter addresses to keep the ones from his selection
                const id = LabelIDs.find((id) => draftList[id]);

                const config = draftList[id];

                if (!config) {
                    return true;
                }
                return config.some((c) => c.Address === (Email || Address));
            }),
            reduce(
                (acc, { Email, Address, ContactID, Name, LabelIDs = [], ID }) => {
                    // Already a cache for this address
                    if (acc.map[ID]) {
                        return acc;
                    }

                    const { Name: Group = '', Address: GroupID } =
                        _.find(MAP_GROUP, (val, ID) => LabelIDs.includes(ID)) || {};
                    const adr = Email || Address;

                    // Because the API is unable to accept extra params...
                    acc.store.push({ Address: adr, ContactID, Name, Group, GroupID, ID, LabelIDs });
                    acc.list.push({ Address: adr, ContactID, Name, Group });
                    acc.map[ID] = true;
                    return acc;
                },
                { list: [], store: [], map: Object.create(null) }
            )
        )(listItems);

        cache.removeDraftConfig(key);
        syncSelection(store, cache);

        // Contacts don't exist anymore
        const needExtendContact = !groupList.length && !oldEmailsGroups.length && oldEmailGroupsList.length;
        if (needExtendContact) {
            contactGroupModel.extend(MAP_GROUP_EMAILS);
        }

        return groupList.concat(emails, !needExtendContact ? oldEmailsGroups : oldEmailGroupsList);
    };

    /**
     * Get a list of recipients ex: the one from the API and format it
     * with groups of recipients if we can
     * @param  {Array}  list
     * @param  {String}  ID Message's ID
     * @param  {String}  key Type of list
     * @return {Array}
     */
    const listInput = (list = [], ID, key) => {
        if (!list.length) {
            return [];
        }

        const { col, groups, nogroup, groupStore } = list.reduce(
            (acc, item) => {
                if (!item.Group) {
                    acc.col.push({ ...item, isContactGroup: false });
                    return acc;
                }

                /*
                    When we load the draft for the first time the user can have a custom selection, we need to keep it
                 */
                const group = contactGroupModel.readName(item.Group);

                // You can save a composer with a group then you delete it
                if (!group) {
                    acc.nogroup.push({
                        ..._.omit(item, 'Group'),
                        isContactGroup: false
                    });
                    return acc;
                }

                !acc.groupStore[group.ID] && (acc.groupStore[group.ID] = []);
                acc.groupStore[group.ID].push(item);

                if (!acc.groupMap[group.ID]) {
                    const obj = {
                        Name: item.Group,
                        Address: group.ID,
                        isContactGroup: true,
                        list: []
                    };
                    acc.groupMap[group.ID] = obj;
                    acc.groups.push(obj);
                }

                // Upgrade the ref, as we might have removed some address from the group
                acc.groupMap[group.ID].list.push(item);
                return acc;
            },
            { col: [], nogroup: [], groups: [], groupMap: {}, groupStore: {} }
        );

        composerContactGroupSelection(ID).storeDraftConfig(key, groupStore);
        return groups.concat(nogroup, col);
    };

    /**
     * Format recipients to auto bind emails attached to a group inside
     * the list if we found one.
     * Not // as if we find the group once ex: inside ToList we want to use
     * the cache intead of doing the same request.
     * @param  {String}  options.ID
     * @param  {Array}  options.CCList
     * @param  {Array}  options.BCCList
     * @param  {Array}  options.BCCList
     * @return {Object}                 { ToList, CCList, BCCList }
     */
    const format = async ({ ID, ToList = [], CCList = [], BCCList = [] } = {}, { ID: messageID } = {}) => ({
        ToList: await formatInput(ToList, ID || messageID, 'ToList'),
        CCList: await formatInput(CCList, ID || messageID, 'CCList'),
        BCCList: await formatInput(BCCList, ID || messageID, 'BCCList')
    });

    const list = ({ ID, ToList = [], CCList = [], BCCList = [] }) => ({
        ToList: listInput(ToList, ID, 'ToList'),
        CCList: listInput(CCList, ID, 'CCList'),
        BCCList: listInput(BCCList, ID, 'BCCList')
    });

    /**
     * Create a list of all the recipients we have for a message.
     * Allow us to list them as uniq entities (remove duplicata) or not
     * @param  {Array}   options.ToList  from a messaeg
     * @param  {Array}   options.CCList  from a messaeg
     * @param  {Array}   options.BCCList from a messaeg
     * @param  {Boolean} uniq            Filter list (default: true)
     * @return {Array}
     */
    const toList = ({ ID, ToList = [], CCList = [], BCCList = [] } = {}, uniq = true) => {
        const set = uniq ? _.uniqBy : _.identity;
        const list = listInput(ToList, ID, 'ToList').concat(
            listInput(CCList, ID, 'CCList'),
            listInput(BCCList, ID, 'BCCList')
        );

        // Prevent storing empty object references.
        composerContactGroupSelection(ID).clear();
        return set(list, 'Address');
    };

    return { format, list, toList, listInput };
}
export default recipientsFormator;
