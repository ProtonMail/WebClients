import _ from 'lodash';

import { LABEL_COLORS } from '../../constants';
import { uniqID } from '../../../helpers/string';

/* @ngInject */
function importContactGroups(
    contactGroupModel,
    manageContactGroup,
    eventManager,
    gettextCatalog,
    notification,
    translator
) {
    /*
        Private constant only usefull for the import
     */
    const ACTIONS = {
        CREATE: 1,
        UPDATE: 2
    };

    const I18N = translator(() => ({
        nothing: gettextCatalog.getString('Do not import group', null, 'Label'),
        [ACTIONS.UPDATE]: gettextCatalog.getString('Merge with existing group', null, 'Label'),
        [ACTIONS.CREATE]: gettextCatalog.getString('Create a new group', null, 'Label'),
        addSuccess(total) {
            return gettextCatalog.getString('{{total}} groups added', { total }, 'Info');
        },
        updateSuccess(total) {
            return gettextCatalog.getString('{{total}} groups updated', { total }, 'Info');
        }
    }));

    /**
     * The order is important, most important one is Update.
     * @type {Array}
     */
    const OPTIONS = [
        {
            value: ACTIONS.UPDATE,
            label: I18N[ACTIONS.UPDATE]
        },
        {
            value: ACTIONS.CREATE,
            label: I18N[ACTIONS.CREATE]
        },
        {
            value: 0,
            label: I18N.nothing
        }
    ];

    const getOptions = () => OPTIONS;

    /**
     * Generate a list of contact groups with contacts we can
     * merge/create etc. post import
     * @param  {Array}   contacts  List of contacts
     * @param  {Object}  map       Map of contact UID -> categories<String>
     * @return {Array}
     */
    const getGroupList = (contacts = [], map = {}) => {
        // Map contacts by categories
        const mapContact = _.reduce(
            contacts,
            (acc, contact) => {
                if (map[contact.UID]) {
                    const categories = map[contact.UID].split(',');
                    categories.forEach((cat) => {
                        !acc[cat] && (acc[cat] = []);
                        acc[cat].push(contact);
                    });
                }
                return acc;
            },
            Object.create(null)
        );

        return Object.keys(mapContact).map((key) => ({
            id: key,
            group: contactGroupModel.readName(key) || {
                ID: uniqID(),
                Name: key,
                isNew: true
            },
            contacts: mapContact[key]
        }));
    };

    /**
     * Create actions based on the user config
     *     - Update a current group
     *     - Create a new group with random colors
     * @param  {Array}  categories Configuration for this import
     * @param  {Object} model      User's model from the contactLoaderModal
     * @return {Object}            { update: [<Promise>], create: [<Promise>] }
     */
    function createActions(categories = [], model = {}) {
        const list = Object.keys(model);
        if (list.length !== categories.length) {
            throw new Error('INVALID');
        }

        const MAP_ACTIONS = {
            [ACTIONS.CREATE]: 'create',
            [ACTIONS.UPDATE]: 'update'
        };

        return list.reduce(
            (acc, id) => {
                const key = MAP_ACTIONS[model[id].action.value];

                if (key === 'update') {
                    const { contacts } = categories.find(({ group }) => group.ID === id);
                    // Extract selected value from the model (modal form)
                    const { value: { value = id } = {} } = model[id].group || {};
                    acc[key].push(
                        manageContactGroup.contact.attach([value], contacts, {
                            noEvent: true,
                            isSilent: true
                        })
                    );
                }

                if (key === 'create') {
                    const { contacts } = categories.find(({ group }) => group.ID === id);
                    acc[key].push(() => {
                        return manageContactGroup.save(
                            {
                                Name: model[id].name,
                                Color: LABEL_COLORS[_.random(0, LABEL_COLORS.length - 1)],
                                ContactIDs: _.map(contacts, 'ID')
                            },
                            true,
                            true
                        );
                    });
                }

                return acc;
            },
            { update: [], create: [] }
        );
    }

    const showNotifications = (created = [], updated = []) => {
        if (created.length) {
            notification.success(I18N.addSuccess(created.length));
        }

        if (updated.length) {
            notification.success(I18N.updateSuccess(updated.length));
        }

        // We can encounter several issues during the process
        const errorsMsg = _.flatten(_.map(created, 'errorsMsg').filter(Boolean));
        if (errorsMsg.length) {
            notification.error(errorsMsg.join('<br>'));
        }
    };

    /**
     * Prepare actions to import groups
     * @param  {Array} categories   Config for this import
     * @return {Promise}
     */
    const action = (categories) => async (model) => {
        const { update, create } = createActions(categories, model);

        const created = [];
        // sequential process as the API is unable to handle //
        for (const request of create) {
            created.push(await request());
        }
        const updated = await Promise.all(update);
        await eventManager.call();

        showNotifications(created, updated);

        return { created, updated };
    };

    function main(contacts = [], mapCategories = {}) {
        const categories = getGroupList(contacts, mapCategories);

        const list = () => categories;
        const getFlag = (flag) => ACTIONS[flag];
        const run = action(categories);

        return { list, run, getFlag };
    }

    main.getOptions = getOptions;

    return main;
}
export default importContactGroups;
