/* @ngInject */
function labelModal(
    pmModal,
    gettextCatalog,
    networkActivityTracker,
    eventManager,
    Label,
    notification,
    sanitize,
    translator
) {
    const I18N = translator(() => ({
        EDIT_FOLDER: gettextCatalog.getString('Edit folder', null, 'Title'),
        EDIT_LABEL: gettextCatalog.getString('Edit label', null, 'Title'),
        CREATE_NEW_FOLDER: gettextCatalog.getString('Create new folder', null, 'Title'),
        CREATE_NEW_LABEL: gettextCatalog.getString('Create new label', null, 'Title'),
        FOLDER_UPDATED: gettextCatalog.getString('Folder updated', null, 'Label modal'),
        LABEL_UPDATED: gettextCatalog.getString('Label updated', null, 'Label modal'),
        FOLDER_CREATED: gettextCatalog.getString('Folder created', null, 'Label modal'),
        LABEL_CREATED: gettextCatalog.getString('Label created', null, 'Label modal'),
        ERROR_FOLDER_NAME: gettextCatalog.getString('Invalid folder name', null, 'Error label modal'),
        ERROR_LABEL_NAME: gettextCatalog.getString('Invalid label name', null, 'Error label modal')
    }));
    /**
     * Get title for label modal
     * @param  {String} ID        Label ID
     * @param  {Number} Exclusive
     * @return {String}
     */
    function getTitle({ ID, Exclusive = 0 }) {
        if (ID) {
            return Exclusive ? I18N.EDIT_FOLDER : I18N.EDIT_LABEL;
        }
        return Exclusive ? I18N.CREATE_NEW_FOLDER : I18N.CREATE_NEW_LABEL;
    }

    /**
     * Get notify value for the toggle
     * @param {Number} Exclusive
     * @param {Number} Notify
     * @return {Boolean}
     */
    function getNotify({ Exclusive = 0, Notify }) {
        if (angular.isDefined(Notify)) {
            return !!Notify;
        }

        return !!Exclusive;
    }

    /**
     * Get success message for label modal
     * @param  {String} ID        Label ID
     * @param  {Number} Exclusive
     * @return {String}
     */
    function getSuccessMessage({ ID, Exclusive = 0 }) {
        if (ID) {
            return Exclusive ? I18N.FOLDER_UPDATED : I18N.LABEL_UPDATED;
        }
        return Exclusive ? I18N.FOLDER_CREATED : I18N.LABEL_CREATED;
    }
    /**
     * Get error color name for label modal
     * @param  {Number} Exclusive
     * @return {String}
     */
    function getErrorColorName({ Exclusive = 0 }) {
        return Exclusive ? I18N.ERROR_FOLDER_NAME : I18N.ERROR_LABEL_NAME;
    }

    const cleanInput = (color = {}) => {
        return {
            ...color,
            Name: sanitize.input(color.Name),
            Color: sanitize.input(color.Color)
        };
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
    function save({ ID, Name = '', Color = '', Display = 1, Exclusive = 0, Notify = 0 }) {
        const action = ID ? 'update' : 'create';

        return Label[action]({ ID, Name, Color, Display, Exclusive, Notify }).then((newLabel) =>
            eventManager.call().then(() => newLabel)
        );
    }

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/label.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { ID, Name = '', Color = '', Exclusive = 0 } = params.label;
            const successMessage = getSuccessMessage(params.label);
            this.ID = ID;
            this.exclusive = Exclusive;
            this.title = getTitle(params.label);
            this.name = Name || '';
            this.notify = getNotify(params.label);
            this.color = Color;

            this.create = (form) => {
                if (form.$invalid) {
                    return; // we display the information inside the form
                }

                const data = cleanInput({
                    ID,
                    Exclusive,
                    Name: this.name,
                    Color: this.color,
                    Notify: +!!this.notify
                });

                // Can be empty for an XSS
                if (!data.Name) {
                    this.name = data.Name;
                    return notification.error(getErrorColorName(data));
                }

                const promise = save(data).then((label) => {
                    notification.success(successMessage);
                    (params.onSuccess || angular.noop)(label);
                    params.close(label);
                });
                networkActivityTracker.track(promise);
            };

            setTimeout(
                () => {
                    angular.element('#labelName').focus();
                },
                100,
                false
            );
        }
    });
}
export default labelModal;
