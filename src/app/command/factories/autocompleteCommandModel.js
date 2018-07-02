import { flow, filter, take } from 'lodash/fp';

import { AWESOMEPLETE_MAX_ITEMS } from '../../constants';
import { ucFirst } from '../../../helpers/string';

/* @ngInject */
function autocompleteCommandModel(hotkeys, labelsModel, $rootScope, gettextCatalog, $stateParams) {
    let scopedList = [];
    const I18N = {
        'Add folder': gettextCatalog.getString('Add folder', null, 'Command palette action'),
        'Add label': gettextCatalog.getString('Add label', null, 'Command palette action'),
        'Remove label': gettextCatalog.getString('Remove label', null, 'Command palette action')
    };

    const COMMANDS = formatCommands(hotkeys.keys());
    const reset = () => (scopedList.length = 0);

    const CUSTOM_FILTERS = {
        messageActions: ['CREATE_REPLY', 'CREATE_REPLY_ALL', 'FORWARD_MSG'].map(hotkeys.translations)
    };

    /**
     * Auto format a toggle action
     *  => add, labels => { label: Add label, value: addLabels }
     * @param  {String} key   Type of action
     * @param  {String} value Value of the action
     * @return {Object}
     */
    function toggleAction(key, value) {
        return {
            label: I18N[`${ucFirst(key)} ${value}`],
            value: `${key}.${value}`,
            key: 'action'
        };
    }

    /**
     * Format default commands coming from the hotkeys
     * Even if hotkeys are not available it works
     *   - label: autocomplete label
     *   - value: hotkey or helper action
     *   - key: custom scope/ type of action
     * @param  {Array}  collection
     * @return {Object}            { map:<hotkeys>:<command:Function>, list:<Array> }
     */
    function formatCommands(collection = []) {
        const { coll, map } = collection.filter(({ description }) => !!description).reduce(
            (acc, { keyboard, description, callback }) => {
                acc.coll.push({
                    label: description,
                    value: keyboard,
                    key: 'hotkey'
                });
                acc.map[`hotkey-${keyboard}`] = callback;
                return acc;
            },
            { coll: [], map: Object.create(null) }
        );

        const LABELS_CONFIG = ['folder', 'label'].reduce((acc, key) => {
            acc.push(toggleAction('add', key));
            key === 'label' && acc.push(toggleAction('remove', key));
            return acc;
        }, []);

        const list = coll.concat(LABELS_CONFIG);
        return { map, list };
    }

    const formatLabels = (key = 'labels') => {
        return labelsModel.get(key).map(({ ID: value, Name: label }) => ({ label, value, key }));
    };

    const stateScoped = (item) => {
        if ($stateParams.id) {
            return true;
        }
        return CUSTOM_FILTERS.messageActions.indexOf(item.label) === -1;
    };

    const all = (type) => {
        if (type === 'labels' || type === 'folders') {
            return angular.copy((scopedList = formatLabels(type)));
        }
        return angular.copy(COMMANDS.list).filter(stateScoped);
    };

    const getList = (type) => {
        if (type === 'labels' || type === 'folders') {
            return scopedList;
        }
        return COMMANDS.list;
    };

    /**
     * Filter a list by type (labels|folders|hotkey) etc. And generate a list for the autocomplete
     * @param  {String} val  User's input
     * @param  {String} mode Mode, default empty -> all commands
     * @return {Object}      { list: <Array>, hasAutocompletion: <Boolean> }
     */
    const filterType = (val = '', mode) => {
        // Do not lowercase value as it might get used by the UI directy via filterList
        const value = val.trim();
        const input = value.toLowerCase();

        const list = flow(
            filter(stateScoped),
            filter(({ label }) => label.toLowerCase().includes(input)),
            take(AWESOMEPLETE_MAX_ITEMS)
        )(getList(mode));

        return { list, hasAutocompletion: !!list.length };
    };

    /**
     * Format custom data to submit via the event
     * @param  {String} mode default empty
     * @param  {String} key  ID for labels/folder
     * @return {Object}
     */
    const formatObjTriggered = (type, mode, key) => {
        if (/labels|folders/.test(mode)) {
            const item = labelsModel.read(key);
            return {
                ID: key,
                list: [((item.Selected = type === 'add'), item)]
            };
        }
    };

    /**
     * Dispatch an action to the app based on the type of action
     * @param  {String} key           Type of the selected value
     * @param  {String} mode.type  Type of mode (ex: add for a label)
     * @param  {String} mode.value Value for a mode (ex: labels for label)
     * @return {void}
     */
    const trigger = (key, { type, value }) => {
        if (!type) {
            return COMMANDS.map[`hotkey-${key}`]();
        }

        $rootScope.$emit('app.commands', {
            type: `${type}.${value}`,
            data: formatObjTriggered(type, value, key)
        });

        reset(); // Clear the scopedList as we don't need it anymore
    };

    return { all, filter: filterType, trigger, reset };
}

export default autocompleteCommandModel;
