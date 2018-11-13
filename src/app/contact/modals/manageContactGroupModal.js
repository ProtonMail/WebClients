import _ from 'lodash';

import { LABEL_TYPE } from '../../constants';
import createScrollHelper from '../../../helpers/dragScrollHelper';

/* @ngInject */
function manageContactGroupModal(
    pmModal,
    contactGroupModel,
    dispatchers,
    contactGroupModal,
    networkActivityTracker,
    manageLabels
) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/manageContactGroupModal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope, userType) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contactGroupModel', 'customCheckbox']);
            const { dragStart, dragMove, dragEnd } = createScrollHelper({
                scrollableSelector: '#groupsContainer'
            });

            const CACHE = {
                selection: Object.create(null),
                selected: false
            };

            this.isFree = userType().isFree;
            this.labels = contactGroupModel.get();
            this.hasSelection = false;
            this.labelsDragControlListeners = {
                containment: '#groupsContainer',
                dragStart,
                dragMove,
                dragEnd,
                accept(sourceItemHandleScope, destSortableScope) {
                    return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                },
                orderChanged: async () => {
                    const order = _.map(this.labels, 'ID');
                    await manageLabels.saveOrder(order, LABEL_TYPE.CONTACT_GROUP);
                    dispatcher.contactGroupModel('reorder.success');
                }
            };

            this.getNumberMembers = ({ ID }) => contactGroupModel.getNumberString(ID);

            this.create = () => {
                params.hide();
                contactGroupModal.activate({
                    params: {
                        previousModal: params,
                        async close() {
                            contactGroupModal.deactivate();
                            await networkActivityTracker.track(contactGroupModel.load(true));
                        }
                    }
                });
            };

            this.selectAll = () => {
                this.labels.forEach((item) => {
                    item.selected = !CACHE.selected;
                    CACHE.selection[item.ID] = item.selected;
                });
                CACHE.selected = !CACHE.selected;
                this.hasSelection = CACHE.selected === true;
            };

            this.removeSelection = async () => {
                const IDs = this.labels.reduce((acc, { ID, selected }) => {
                    selected && acc.push(ID);
                    return acc;
                }, []);

                const allowed = await manageLabels.remove({ IDs }, LABEL_TYPE.CONTACT_GROUP);

                if (!allowed) {
                    return;
                }

                return contactGroupModel.remove(IDs);
            };

            /**
             * Select an interval based on the last selected item state
             * @param  {String} idStart ID label
             * @param  {String} idEnd   ID label
             * @return {void}
             */
            const toggleSelectionBetween = (idStart, idEnd) => {
                let scope = false;

                this.labels.forEach((item) => {
                    if (item.ID === idStart) {
                        scope = true;
                    }

                    if (scope) {
                        // Set the state of the item start + update cache
                        item.selected = CACHE.selection[idStart];
                        CACHE.selection[item.ID] = item.selected;
                    }

                    if (item.ID === idEnd) {
                        scope = false;
                        this.hasSelection = this.labels.some((selected) => selected);
                    }
                });
            };

            on('contactGroupModel', (e, { type }) => {
                if (/^cache\.(update|refresh)$/.test(type)) {
                    $scope.$applyAsync(() => {
                        this.labels = contactGroupModel.get().map((item) => ({
                            ...item,
                            selected: CACHE.selection[item.ID]
                        }));
                    });
                }
            });

            on('customCheckbox', (e, { type, data: { event } }) => {
                if (type === 'change') {
                    $scope.$applyAsync(() => {
                        const labelID = event.target.dataset.labelId;

                        // Store selection as reorder will erase the state
                        CACHE.selection = this.labels.reduce((acc, { ID, selected }) => {
                            acc[ID] = selected;
                            return acc;
                        }, Object.create(null));

                        // Multiple selection
                        if (event.shiftKey) {
                            toggleSelectionBetween(CACHE.latestSelection, labelID);
                        }

                        CACHE.latestSelection = labelID;
                        this.hasSelection = this.labels.some(({ ID }) => CACHE.selection[ID]);
                    });
                }
            });

            this.$onDestroy = unsubscribe;
        }
    });
}
export default manageContactGroupModal;
