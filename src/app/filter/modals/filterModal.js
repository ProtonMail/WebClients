import _ from 'lodash';

import { FILTER_VERSION } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { templates as sieveTemplates } from '../../../helpers/sieve';

/* @ngInject */
function filterModal(
    $timeout,
    pmModal,
    gettextCatalog,
    Filter,
    networkActivityTracker,
    notification,
    dispatchers,
    eventManager,
    labelModal,
    labelsModel,
    sieveLint,
    filterValidator,
    userType,
    translator
) {
    const I18N = translator(() => ({
        TYPES: [
            { label: gettextCatalog.getString('Select', null, 'Filter modal type'), value: 'select' },
            { label: gettextCatalog.getString('the subject', null, 'Filter modal type'), value: 'subject' },
            { label: gettextCatalog.getString('the sender', null, 'Filter modal type'), value: 'sender' },
            { label: gettextCatalog.getString('the recipient', null, 'Filter modal type'), value: 'recipient' },
            { label: gettextCatalog.getString('the attachments', null, 'Filter modal type'), value: 'attachments' }
        ],
        COMPARATORS: [
            { label: gettextCatalog.getString('contains', null, 'Condition for custom filter'), value: 'contains' },
            { label: gettextCatalog.getString('is exactly', null, 'Condition for custom filter'), value: 'is' },
            { label: gettextCatalog.getString('begins with', null, 'Condition for custom filter'), value: 'starts' },
            { label: gettextCatalog.getString('ends with', null, 'Condition for custom filter'), value: 'ends' },
            { label: gettextCatalog.getString('matches', null, 'Condition for custom filter'), value: 'matches' },
            {
                label: gettextCatalog.getString('does not contain', null, 'Condition for custom filter'),
                value: '!contains'
            },
            { label: gettextCatalog.getString('is not', null, 'Condition for custom filter'), value: '!is' },
            {
                label: gettextCatalog.getString('does not begin with', null, 'Condition for custom filter'),
                value: '!starts'
            },
            {
                label: gettextCatalog.getString('does not end with', null, 'Condition for custom filter'),
                value: '!ends'
            },
            {
                label: gettextCatalog.getString('does not match', null, 'Condition for custom filter'),
                value: '!matches'
            }
        ],
        OPERATORS: [
            {
                label: gettextCatalog.getString(
                    'All conditions must be fulfilled (AND)',
                    null,
                    'Filter modal operators'
                ),
                value: 'all'
            },
            {
                label: gettextCatalog.getString('One condition must be fulfilled (OR)', null, 'Filter modal operators'),
                value: 'any'
            }
        ],
        ERROR_PATTERN: gettextCatalog.getString('Text or pattern already included', null, 'Error'),
        FILTER_UPDATED_SUCCESS: gettextCatalog.getString('Filter updated', null, 'Notification'),
        FILTER_CREATED_SUCCESS: gettextCatalog.getString('Filter created', null, 'Notification')
    }));

    /**
     * Filter the list of new Label by type
     * @param  {Array}  options.create List of new label
     * @param  {Integer} type           flag
     * @return {Array}                Copy of the array as we don't want to work on the ref
     */
    const filterNewLabel = ({ create = [] } = {}, type = labelsModel.IS_LABEL) => {
        return angular.copy(create).filter(({ Exclusive }) => Exclusive === type);
    };

    const getFoldersConfig = () => {
        const folders = labelsModel.get('folders').map((folder) => ({
            label: gettextCatalog.getString('Move to {{Name}}', folder, 'Notification'),
            value: folder.Path
        }));

        return [
            {
                label: gettextCatalog.getString('Move to ...', null, 'Filter modal action')
            },
            {
                label: gettextCatalog.getString('Move to archive', null, 'Filter modal action'),
                value: 'archive'
            },
            {
                label: gettextCatalog.getString('Move to mailbox', null, 'Filter modal action'),
                value: 'inbox'
            },
            ...folders
        ].map((item) => ({ ...item, $$id: (item.value || {}).ID || Date.now() }));
    };
    const getMarkAsConfig = () => [
        {
            label: gettextCatalog.getString('Mark as ...', null, 'Filter modal action')
        },
        {
            label: gettextCatalog.getString('Mark as Read', null, 'Label'),
            value: 'read'
        },
        {
            label: gettextCatalog.getString('Mark as Starred', null, 'Label'),
            value: 'starred'
        }
    ];

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/filter/modal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            sieveLint.init();

            const model = angular.copy(params.filter);
            const { on, unsubscribe, dispatcher } = dispatchers(['autocompleteLabels']);

            const getDefaultValue = (mode) => {
                const { Actions } = this.filter.Simple;
                if (mode === 'markAs') {
                    if (Actions.Mark.Starred && !Actions.Mark.Read) {
                        return 'starred';
                    }

                    if (!Actions.Mark.Starred && Actions.Mark.Read) {
                        return 'read';
                    }
                }
            };

            /**
             * Prepare the Conditions Model
             * @param {Object}
             * @return {Array}
             */
            const prepareConditions = ({ Simple = {} } = {}) => {
                const { Conditions = [] } = Simple;
                const conditions = Conditions.map(({ Type = {}, Comparator = {}, Values = [], value = '' }) => ({
                    Values: value ? Values.concat([value]) : Values,
                    value: value ? '' : value,
                    Type: _.find(this.types, { value: Type.value }),
                    Comparator: _.find(this.comparators, { value: Comparator.value })
                }));

                if (conditions.length === 0) {
                    conditions.push({
                        Values: [],
                        value: '',
                        Type: this.types[0],
                        Comparator: this.comparators[0]
                    });
                }

                return conditions;
            };

            const prepareActions = ({ Simple = {} } = {}) => {
                const { Mark = { Read: false, Starred: false }, Vacation = '' } = Simple.Actions || {};
                return {
                    Move: '',
                    Vacation,
                    Mark
                };
            };

            const prepareID = ({ ID = '' } = {}) => ID;
            const prepareName = ({ Name = '' } = {}) => Name;
            const prepareStatus = ({ Status = 1 } = {}) => Status;
            const prepareVersion = ({ Version = FILTER_VERSION } = {}) => Version;
            const prepareOperator = ({ Simple = {} } = {}) => {
                const { value = 'all' } = Simple.Operator || {};
                return _.find(this.operators, { value });
            };

            const ACTIONS = {
                markAs: (value) => ({
                    Mark: {
                        Starred: value === 'starred',
                        Read: value === 'read'
                    }
                }),
                moveTo: (value) => ({ FileInto: [value] }),
                labels: (Labels, Move) => ({
                    FileInto: [Move, ..._.map(Labels, 'Name')].filter(Boolean)
                })
            };

            const formatFilter = ({ filter, markAsValue, selectedLabels }) => {
                return {
                    ...filter,
                    Simple: {
                        ...filter.Simple,
                        Actions: {
                            ...filter.Simple.Actions,
                            ...ACTIONS.markAs(markAsValue),
                            ...ACTIONS.labels(selectedLabels, filter.Simple.Actions.Move)
                        }
                    }
                };
            };

            this.isPaid = userType().isPaid;
            this.folders = getFoldersConfig();
            this.markAs = getMarkAsConfig();
            this.types = angular.copy(I18N.TYPES);
            this.comparators = angular.copy(I18N.COMPARATORS);
            this.operators = angular.copy(I18N.OPERATORS);
            this.selectedLabels = [];
            this.mode = params.mode;
            this.filter = {
                ID: prepareID(model),
                Name: prepareName(model),
                Status: prepareStatus(model),
                Version: prepareVersion(model)
            };

            if (params.mode === 'simple') {
                this.filter.Simple = {
                    Operator: prepareOperator(model),
                    Conditions: prepareConditions(model),
                    Actions: prepareActions(model)
                };
            }

            if (params.mode === 'complex') {
                const defaultFilter = sieveTemplates[this.filter.Version] || '';
                this.filter.Sieve = model ? model.Sieve : defaultFilter;
            }

            this.markAsValue = getDefaultValue('markAs');

            /**
             * Condition Attachements:
             * When you select an option, assign the valid object to the comparator on change
             * @param  {Object} model
             * @param  {String} value Value selected
             * @return {void}
             */
            this.onChangeAttachements = (model, value) => {
                model.Comparator = _.find(this.comparators, { value });
            };

            this.resetValidity = () => (this.validator = {});
            this.removeLabel = (index, label) => {
                this.selectedLabels.splice(index, 1);
                dispatcher.autocompleteLabels('remove', { label });
            };

            this.addValue = (condition, event) => {
                event && event.preventDefault();

                if (condition.Values.indexOf(condition.value) > -1) {
                    return notification.error(I18N.ERROR_PATTERN);
                }

                if (condition.value) {
                    condition.Values.push(condition.value);
                    condition.value = '';
                }
            };

            this.addCondition = () => {
                this.filter.Simple.Conditions.push({
                    Type: _.head(this.types),
                    Comparator: _.head(this.comparators),
                    Values: [],
                    value: ''
                });
            };

            this.removeCondition = (condition) => {
                const index = this.filter.Simple.Conditions.indexOf(condition);
                this.filter.Simple.Conditions.splice(index, 1);

                if (!this.filter.Simple.Conditions.length) {
                    this.filter.Simple.Conditions.push({
                        Values: [],
                        value: '',
                        Type: this.types[0],
                        Comparator: this.comparators[0]
                    });
                }
            };

            const requestUpdate = (data = {}) => {
                const onSuccess = (message = '') => () => {
                    notification.success(message);
                    eventManager.call();
                    params.close();
                };

                const onError = (e) => {
                    const { data = {} } = e;
                    if (data.Code === API_CUSTOM_ERROR_CODES.FILTER_CREATE_TOO_MANY_ACTIVE) {
                        eventManager.call();
                        params.close();
                    }
                    throw e;
                };

                if (data.ID) {
                    return Filter.update(data)
                        .then(onSuccess(I18N.FILTER_UPDATED_SUCCESS))
                        .catch(onError);
                }

                return Filter.create(data)
                    .then(onSuccess(I18N.FILTER_CREATED_SUCCESS))
                    .catch(onError);
            };

            this.save = async () => {
                const filter = formatFilter(this);
                const { valid, errors } = await filterValidator(filter);

                $scope.$applyAsync(() => {
                    this.validator = errors;
                });

                if (!valid) {
                    return console.log(errors);
                }

                if (params.mode === 'complex') {
                    // we need to wait on codemirror to update the ng-model
                    $timeout(
                        () => {
                            const clone = angular.copy(this.filter);
                            // Disable the old Simple data
                            delete clone.Simple;
                            delete clone.Tree;
                            networkActivityTracker.track(requestUpdate(clone));
                        },
                        100,
                        false
                    );
                    return;
                }

                networkActivityTracker.track(requestUpdate(filter));
            };

            if (angular.isObject(this.filter.Simple)) {
                on('labelsModel', (e, { type, data }) => {
                    if (type === 'cache.update') {
                        $scope.$applyAsync(() => {
                            const newFolders = filterNewLabel(data, labelsModel.IS_FOLDER);
                            this.folders = this.folders.concat(newFolders);

                            // Select the last new folder
                            if (newFolders.length) {
                                this.filter.Simple.Actions.Move = _.last(this.folders).Name;
                            }
                        });
                    }
                });

                on('autocompleteEmail', (e, { type, data }) => {
                    if (type === 'input.blur' && data.type === 'filter-modal-add-condition-input') {
                        this.addValue(this.filter.Simple.Conditions[+data.eventData]);
                    }
                });

                on('autocompleteLabels', (e, { type, data }) => {
                    if (type === 'select') {
                        $scope.$applyAsync(() => {
                            this.selectedLabels.push(data.value);
                        });
                    }
                });
            }

            const onMouseOverCancel = () => angular.element('#filterName').blur();

            $scope.$on('$destroy', () => {
                const $close = angular.element('[ng-click="ctrl.cancel()"]');

                $close.off('mouseover', onMouseOverCancel);
                unsubscribe();
            });

            $timeout(
                () => {
                    angular.element('#filterName').focus();
                    const $close = angular.element('[ng-click="ctrl.cancel()"]');
                    $close.on('mouseover', onMouseOverCancel);
                },
                100,
                false
            );
        }
    });
}
export default filterModal;
