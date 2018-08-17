import _ from 'lodash';
import createScrollHelper from '../../../helpers/dragScrollHelper';

/* @ngInject */
function LabelsController(
    dispatchers,
    $scope,
    gettextCatalog,
    $log,
    authentication,
    confirmModal,
    eventManager,
    Label,
    labelModal,
    labelsModel,
    networkActivityTracker,
    notification
) {
    const { on, unsubscribe } = dispatchers();

    const I18N = {
        labelUpdated: gettextCatalog.getString('Label updated', null, 'Success'),
        folderUpdated: gettextCatalog.getString('Folder updated', null, 'Success')
    };

    const changeNotify = (event, { data: { id, status } }) => {
        const { Name, Color, Display, Exclusive } = _.find($scope.labels, { ID: id });
        const promise = Label.update({ ID: id, Name, Color, Display, Exclusive, Notify: status ? 1 : 0 })
            .then(eventManager.call)
            .then(() => notification.success(Exclusive ? I18N.folderUpdated : I18N.labelUpdated));

        networkActivityTracker.track(promise);
    };

    const setLabels = () => ($scope.labels = labelsModel.get());

    setLabels();

    const { dragStart, dragMove, dragEnd } = createScrollHelper({ scrollableSelector: '#labelContainer' });
    // Drag and Drop configuration
    $scope.labelsDragControlListeners = {
        containment: '#labelContainer',
        dragStart,
        dragMove,
        dragEnd,
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged() {
            const newOrder = _.map($scope.labels, 'ID');
            $scope.saveLabelOrder(newOrder);
        }
    };

    // Listeners
    on('changeNotifyLabel', changeNotify);
    on('labelsModel', (e, { type }) => {
        if (type === 'cache.update' || type === 'cache.refresh') {
            $scope.$applyAsync(() => setLabels());
        }
    });

    $scope.$on('$destroy', unsubscribe);

    function openLabelModal(label) {
        labelModal.activate({
            params: {
                label,
                onSuccess() {
                    // Auto Scroll to the latest item
                    const id = setTimeout(() => {
                        const $li = document.querySelector('.labelsState-item:last-child');
                        $li && $li.scrollIntoView();
                        clearTimeout(id);
                    }, 500);
                },
                close() {
                    labelModal.deactivate();
                }
            }
        });
    }

    /**
     * Open modal to create a new label
     */
    $scope.createLabel = () => {
        openLabelModal({ Exclusive: 0, Notify: 1 });
    };

    /**
     * Open modal to create a new folder
     */
    $scope.createFolder = () => {
        openLabelModal({ Exclusive: 1, Notify: 0 });
    };

    /**
     * Open modal to edit label / folder
     * @param {Object} label
     */
    $scope.editLabel = (label) => {
        openLabelModal(label);
    };

    $scope.sortLabels = () => {
        $scope.labels = labelsModel.sort();
        const newOrder = _.map($scope.labels, 'ID');
        $scope.saveLabelOrder(newOrder);
    };

    function getTitleDeleteLabel({ Exclusive }) {
        return Exclusive
            ? gettextCatalog.getString('Delete folder', null, 'Title')
            : gettextCatalog.getString('Delete label', null, 'Title');
    }

    function getMessageDeleteLabel({ Exclusive }) {
        if (Exclusive) {
            return {
                CONFIRM: gettextCatalog.getString(
                    'Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.',
                    null,
                    'Info'
                ),
                NOTIF: gettextCatalog.getString('Folder deleted', null)
            };
        }

        return {
            CONFIRM: gettextCatalog.getString(
                'Are you sure you want to delete this label? Removing a label will not remove the messages with that label.',
                null,
                'Info'
            ),
            NOTIF: gettextCatalog.getString('Label deleted', null)
        };
    }

    $scope.deleteLabel = (label) => {
        const title = getTitleDeleteLabel(label);
        const { CONFIRM, NOTIF } = getMessageDeleteLabel(label);
        confirmModal.activate({
            params: {
                title,
                message: CONFIRM,
                confirm() {
                    const promise = Label.delete(label.ID)
                        .then(eventManager.call)
                        .then(() => {
                            confirmModal.deactivate();
                            notification.success(NOTIF);
                        });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.saveLabelOrder = (LabelIDs) => {
        // why uniq is required: 'as-sortable' has a bug when we update the list and if the user DnD in the same time (#7345)
        // uniq avoid API error but not this kind of error: "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys."
        const promise = Label.order({ LabelIDs: _.uniq(LabelIDs) })
            .then(eventManager.call)
            .then(() => {
                notification.success(gettextCatalog.getString('Label order saved', null));
            });

        networkActivityTracker.track(promise);
    };
}
export default LabelsController;
