angular.module('proton.core')
.factory('filterModal', ($timeout, $rootScope, pmModal, gettextCatalog, Filter, networkActivityTracker, notify, CONSTANTS, eventManager, labelModal, labelsModel) => {

    const TRANSLATIONS = {
        TYPES: [
            { label: gettextCatalog.getString('Select', null), value: 'select' },
            { label: gettextCatalog.getString('the subject', null), value: 'subject' },
            { label: gettextCatalog.getString('the sender', null), value: 'sender' },
            { label: gettextCatalog.getString('the recipient', null), value: 'recipient' },
            { label: gettextCatalog.getString('the attachments', null), value: 'attachments' }
        ],
        COMPARATORS: [
            { label: gettextCatalog.getString('contains', null), value: 'contains' },
            { label: gettextCatalog.getString('is exactly', null), value: 'is' },
            { label: gettextCatalog.getString('begins with', null), value: 'starts' },
            { label: gettextCatalog.getString('ends with', null), value: 'ends' },
            { label: gettextCatalog.getString('matches', null), value: 'matches' },
            { label: gettextCatalog.getString('does not contain', null), value: '!contains' },
            { label: gettextCatalog.getString('is not', null), value: '!is' },
            { label: gettextCatalog.getString('does not begin with', null), value: '!starts' },
            { label: gettextCatalog.getString('does not end with', null), value: '!ends' },
            { label: gettextCatalog.getString('does not match', null), value: '!matches' }
        ],
        OPERATORS: [
            { label: gettextCatalog.getString('all', null), value: 'all' },
            { label: gettextCatalog.getString('any', null), value: 'any' }
        ],
        ERROR_PATTERN: gettextCatalog.getString('Text or pattern already included', null),
        FILTER_UPDATED_SUCCESS: gettextCatalog.getString('Filter updated', null, 'Notification'),
        FILTER_CREATED_SUCCESS: gettextCatalog.getString('Filter created', null, 'Notification')
    };

    /**
     * Filter the list of new Label by type
     * @param  {Array}  options.create List of new label
     * @param  {Integer} type           flag
     * @return {Array}                Copy of the array as we don't want to work on the ref
     */
    const filterNewLabel = ({ create = [] } = {}, type = labelsModel.IS_LABEL) => {
        return angular.copy(create).filter(({ Exclusive }) => Exclusive === type);
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/filter.tpl.html',
        controller(params, $scope) {
            const labelsOrdered = labelsModel.get('labels');
            const foldersOrdered = labelsModel.get('folders');
            const ctrl = this;
            const model = angular.copy(params.filter);

            ctrl.hasLabels = false;
            ctrl.hasMove = false;
            ctrl.hasMark = false;
            ctrl.folders = foldersOrdered;

            ctrl.types = angular.copy(TRANSLATIONS.TYPES);
            ctrl.comparators = angular.copy(TRANSLATIONS.COMPARATORS);
            ctrl.operators = angular.copy(TRANSLATIONS.OPERATORS);
            /**
             * Open a modal to create a new folder / label
             * @param  {Number} [Exclusive=0]
             */
            function openLabelModal(Exclusive = 0) {
                labelModal.activate({
                    params: {
                        label: { Exclusive },
                        close() {
                            labelModal.deactivate();
                        }
                    }
                });
            }

            /**
             * Prepare the Conditions Model
             * @param {Object}
             * @return {Array}
             */
            function prepareConditions({ Simple = {} } = {}) {
                const { Conditions = [] } = Simple;
                const conditions = Conditions.map(({ Type = {}, Comparator = {}, Values = [] }) => ({
                    Values,
                    value: '',
                    Type: _.findWhere(ctrl.types, { value: Type.value }),
                    Comparator: _.findWhere(ctrl.comparators, { value: Comparator.value })
                }));

                if (conditions.length === 0) {
                    conditions.push({
                        Values: [],
                        value: '',
                        Type: ctrl.types[0],
                        Comparator: ctrl.comparators[0]
                    });
                }

                return conditions;
            }

            const findCurrentMoveFolder = (list = []) => {
                const map = labelsModel.get('folders')
                    .reduce((acc, label) => (acc[label.Name] = label, acc), {});
                const folder = _.find(list, (key) => CONSTANTS.MAILBOX_IDENTIFIERS[key] || map[key]);
                return folder || '';
            };

            /**
             * Prepare the Actions Model
             * @param {Object}
             * @return {Object} actions
             */
            function prepareActions({ Simple = {} } = {}) {
                const { FileInto = [], Mark = { Read: false, Starred: false } } = Simple.Actions || {};
                const move = findCurrentMoveFolder(FileInto);
                ctrl.hasMove = !!move;
                ctrl.hasMark = Mark.Read || Mark.Starred;

                const actions = {
                    Labels: labelsOrdered.map((label) => {
                        label.Selected = FileInto.indexOf(label.Name) !== -1;
                        return label;
                    }),
                    Move: move || 'inbox',
                    Mark
                };

                ctrl.hasLabels = !!_.where(actions.Labels, { Selected: true }).length;
                return actions;
            }

            /**
             * Prepare the Operator model
             * @param {Object}
             * @return {Object}
             */
            function prepareOperator({ Simple = {} } = {}) {
                const { value = 'all' } = Simple.Operator || {};
                return _.findWhere(ctrl.operators, { value });
            }

            /**
             * Prepare the ID
             * @param  {String} {ID=''}
             * @return {String}
             */
            function prepareID({ ID = '' } = {}) {
                return ID;
            }

            /**
             * Prepare the Name
             * @param  {String} Name
             * @return {String}
             */
            function prepareName({ Name = '' } = {}) {
                return Name;
            }

            /**
             * Prepare the Status
             * @param  {Integer} Status
             * @return {Integer}
             */
            function prepareStatus({ Status = 1 } = {}) {
                return Status;
            }

            ctrl.addLabel = () => openLabelModal(0);
            ctrl.addFolder = () => openLabelModal(1);

            ctrl.initialization = () => {
                ctrl.filter = {
                    ID: prepareID(model),
                    Name: prepareName(model),
                    Status: prepareStatus(model),
                    Version: CONSTANTS.FILTER_VERSION
                };

                if (params.mode === 'simple') {
                    ctrl.mode = 'simple';
                    ctrl.filter.Simple = {
                        Operator: prepareOperator(model),
                        Conditions: prepareConditions(model),
                        Actions: prepareActions(model)
                    };
                } else if (params.mode === 'complex') {
                    ctrl.mode = 'complex';
                    ctrl.filter.Sieve = model.Sieve;
                }

                if (angular.isObject(ctrl.filter.Simple)) {

                    const unsubscribe = $rootScope.$on('labelsModel', (e, { type, data }) => {
                        if (type === 'cache.update') {
                            $scope.$applyAsync(() => {
                                ctrl.filter.Simple.Actions.Labels = ctrl.filter.Simple.Actions.Labels.concat(filterNewLabel(data));
                                ctrl.folders = ctrl.folders.concat(filterNewLabel(data, labelsModel.IS_FOLDER));
                            });
                        }
                    });

                    ctrl.$onDestroy = () => {
                        unsubscribe();
                    };
                }

                $timeout(() => {
                    angular.element('#filterName').focus();
                }, 100, false);
            };

            /**
             * Condition Attachements:
             * When you select an option, assign the valid object to the comparator on change
             * @param  {Object} model
             * @param  {String} value Value selected
             * @return {void}
             */
            ctrl.onChangeAttachements = (model, value) => {
                model.Comparator = _.findWhere(ctrl.comparators, { value });
            };

            ctrl.displaySeparator = () => {
                if (ctrl.filter.Simple) {
                    const conditions = ctrl.filter.Simple.Conditions;
                    return conditions.length > 0 && conditions[0].Type.value !== 'select';
                }

                return false;
            };

            ctrl.valid = () => {
                let pass = true;

                // Check name
                pass = ctrl.filter.Name.length > 0;

                if (Object.keys(ctrl.filter.Simple || {}).length > 0) {
                    // Simple mode
                    // Check conditions
                    let attachmentsCondition = 0;

                    _.each(ctrl.filter.Simple.Conditions, (condition) => {
                        pass = pass && condition.Type.value !== 'select';

                        if (condition.Type.value === 'subject' || condition.Type.value === 'sender' || condition.Type.value === 'recipient') {
                            pass = pass && condition.Values.length > 0;
                        }

                        if (condition.Type.value === 'attachments') {
                            attachmentsCondition++;
                        }
                    });

                    pass = pass && attachmentsCondition <= 1;

                    // Check actions
                    pass = pass && (ctrl.hasLabels || ctrl.hasMove || ctrl.hasMark);

                    if (ctrl.hasLabels === true) {
                        pass = pass && _.where(ctrl.filter.Simple.Actions.Labels, { Selected: true }).length > 0;
                    }

                    if (ctrl.hasMark === true) {
                        pass = pass && (ctrl.filter.Simple.Actions.Mark.Starred || ctrl.filter.Simple.Actions.Mark.Read);
                    }

                    if (ctrl.hasMove === true) {
                        pass = pass && !!ctrl.filter.Simple.Actions.Move;
                    }

                    return pass;
                }
                // Complex mode
                // Check sieve script content
                return ctrl.filter.Sieve.length > 0;
            };

            ctrl.addCondition = () => {
                ctrl.filter.Simple.Conditions.push({
                    Type: _.first(ctrl.types),
                    Comparator: _.first(ctrl.comparators),
                    Values: [],
                    value: ''
                });
            };

            ctrl.addValue = (condition) => {
                if (condition.Values.indexOf(condition.value) === -1) {
                    if (condition.value) {
                        condition.Values.push(condition.value);
                        condition.value = '';
                    }
                } else {
                    notify({ message: TRANSLATIONS.ERROR_PATTERN, classes: 'notification-danger' });
                }
            };

            ctrl.removeCondition = (condition) => {
                const index = ctrl.filter.Simple.Conditions.indexOf(condition);
                ctrl.filter.Simple.Conditions.splice(index, 1);
            };

            /**
             * Create a list of place to move the message
             * @param  {Array}  options.FileInto
             * @param  {String} options.Move
             * @param  {Array}  labels
             * @return {Array}
             */
            const bindFileInto = ({ FileInto = [], Move = '' } = {}, labels = []) => {
                return _.uniq([Move].filter(Boolean).concat(FileInto, labels));
            };

            const requestUpdate = (data = {}) => {

                const onSuccess = (message = '') => (result) => {
                    if (result.data && result.data.Code === 1000) {
                        notify({ message, classes: 'notification-success' });
                        eventManager.call();
                        params.close();
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });

                        if (result.data.Code === 50016) {
                            eventManager.call();
                            params.close();
                        }
                    }
                };

                if (data.ID) {
                    return Filter.update(data).then(onSuccess(TRANSLATIONS.FILTER_UPDATED_SUCCESS));
                }
                return Filter.create(data).then(onSuccess(TRANSLATIONS.FILTER_CREATED_SUCCESS));
            };

            ctrl.save = () => {
                const clone = angular.copy(ctrl.filter);

                if (Object.keys(ctrl.filter.Simple || {}).length > 0) {

                    if (ctrl.hasMove === false) {
                        clone.Simple.Actions.Move = '';
                    }

                    if (ctrl.hasMark === false) {
                        clone.Simple.Actions.Mark = { Read: false, Starred: false };
                    }

                    if (ctrl.hasLabels === true) {
                        const labels = _.filter(clone.Simple.Actions.Labels, ({ Selected }) => Selected === true)
                            .map(({ Name }) => Name);
                        const fileInto = bindFileInto(clone.Simple.Actions, labels);
                        clone.Simple.Actions.FileInto = fileInto;
                        delete clone.Simple.Actions.Labels;
                    } else {
                        delete clone.Simple.Actions.Labels;
                    }
                }

                clone.Simple.Actions.FileInto = bindFileInto(clone.Simple.Actions);
                delete clone.Simple.Actions.Move;

                networkActivityTracker.track(requestUpdate(clone));
            };

            ctrl.cancel = () => {
                params.close();
            };

            ctrl.initialization();
        }
    });
});
