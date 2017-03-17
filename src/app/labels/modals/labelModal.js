angular.module('proton.labels')
.factory('labelModal', (pmModal, tools, hotkeys, gettextCatalog, networkActivityTracker, eventManager, Label, notify) => {
    const COLORS_LIST = tools.colors();
    const TRANSLATIONS = {
        EDIT_FOLDER: gettextCatalog.getString('Edit folder', null, 'Title'),
        EDIT_LABEL: gettextCatalog.getString('Edit label', null, 'Title'),
        CREATE_NEW_FOLDER: gettextCatalog.getString('Create new folder', null, 'Title'),
        CREATE_NEW_LABEL: gettextCatalog.getString('Create new label', null, 'Title'),
        FOLDER_UPDATED: gettextCatalog.getString('Folder updated', null),
        LABEL_UPDATED: gettextCatalog.getString('Label updated', null),
        FOLDER_CREATED: gettextCatalog.getString('Folder created', null),
        LABEL_CREATED: gettextCatalog.getString('Label created', null),
        ERROR_MESSAGE: gettextCatalog.getString('Error when saving label', null),
        ERROR_FOLDER_NAME: gettextCatalog.getString('Invalid folder name', null),
        ERROR_LABEL_NAME: gettextCatalog.getString('Invalid label name', null)
    };
    /**
     * Get title for label modal
     * @param  {String} ID        Label ID
     * @param  {Number} Exclusive
     * @return {String}
     */
    function getTitle({ ID, Exclusive = 0 }) {
        if (ID) {
            return Exclusive ? TRANSLATIONS.EDIT_FOLDER : TRANSLATIONS.EDIT_LABEL;
        }
        return Exclusive ? TRANSLATIONS.CREATE_NEW_FOLDER : TRANSLATIONS.CREATE_NEW_LABEL;
    }

    /**
     * Get success message for label modal
     * @param  {String} ID        Label ID
     * @param  {Number} Exclusive
     * @return {String}
     */
    function getSuccessMessage({ ID, Exclusive = 0 }) {
        if (ID) {
            return Exclusive ? TRANSLATIONS.FOLDER_UPDATED : TRANSLATIONS.LABEL_UPDATED;
        }
        return Exclusive ? TRANSLATIONS.FOLDER_CREATED : TRANSLATIONS.LABEL_CREATED;
    }
    /**
     * Get error color name for label modal
     * @param  {Number} Exclusive
     * @return {String}
     */
    function getErrorColorName({ Exclusive = 0 }) {
        return Exclusive ? TRANSLATIONS.ERROR_FOLDER_NAME : TRANSLATIONS.ERROR_LABEL_NAME;
    }

    const cleanInput = (color = {}) => {
        return _.extend({}, color, {
            Name: DOMPurify.sanitize(color.Name),
            Color: DOMPurify.sanitize(color.Color)
        });
    };

    /**
     * Save label
     * @param  {String} ID           Label ID
     * @param  {String} [Name='']    Label Name
     * @param  {String} [Color='']   Color
     * @param  {Number} [Display=1]  Display or hide the label
     * @param  {Number} [Exclusive=0 }]            Folder (1) or Label (0)
     * @return {Promise}
     */
    function save({ ID, Name = '', Color = '', Display = 1, Exclusive = 0 }) {
        const action = ID ? 'update' : 'create';
        return Label[action]({ ID, Name, Color, Display, Exclusive })
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                return data.Label;
            }
            throw new Error(data.Error || TRANSLATIONS.ERROR_MESSAGE);
        })
        .then((newLabel) => eventManager.call().then(() => newLabel));
    }

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/label.tpl.html',
        controller(params) {
            const self = this;
            const { ID, Name = '', Color = '', Exclusive = 0 } = params.label;
            const successMessage = getSuccessMessage(params.label);
            const index = _.random(0, COLORS_LIST.length - 1);
            self.title = getTitle(params.label);
            self.name = Name || '';
            self.colors = COLORS_LIST;
            self.color = Color || COLORS_LIST[index];

            hotkeys.unbind();

            self.create = () => {
                const data = cleanInput({ ID, Name: self.name, Color: self.color, Exclusive });

                // Can be empty for an XSS
                if (!data.Name) {
                    self.name = data.Name;
                    return notify({ message: getErrorColorName(data), classes: 'notification-danger' });
                }

                const promise = save(data)
                    .then((label) => {
                        notify({ message: successMessage, classes: 'notification-success' });
                        hotkeys.bind();
                        (params.onSuccess || angular.noop)(label);
                        params.close(label);
                    });
                networkActivityTracker.track(promise);
            };

            self.cancel = () => {
                params.close();
                hotkeys.bind();
            };

            setTimeout(() => {
                angular.element('#labelName').focus();
            }, 100, false);
        }
    });
});
