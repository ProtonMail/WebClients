angular.module('proton.settings')
.controller('LabelsController', (
    $rootScope,
    $scope,
    gettextCatalog,
    $log,
    authentication,
    confirmModal,
    eventManager,
    Label,
    labelModal,
    networkActivityTracker,
    cacheCounters,
    labelsEditorModel,
    notify
) => {
    // Variables
    const unsubscribe = [];

    $scope.labels = labelsEditorModel.load();

    // Drag and Drop configuration
    $scope.labelsDragControlListeners = {
        containment: '#labelContainer',
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged() {
            const order = labelsEditorModel.getOrder();
            labelsEditorModel.update();
            $scope.saveLabelOrder(order);
        }
    };

    // Listeners
    unsubscribe.push($rootScope.$on('labelsModel', (e, { type }) => {
        if (type === 'cache.update' || type === 'cache.refresh') {
            $scope.$applyAsync(() => ($scope.labels = labelsEditorModel.load()));
        }
    }));

    $scope.$on('$destroy', () => {
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });

    function openLabelModal(label) {
        labelModal.activate({
            params: {
                label,
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
        openLabelModal({ Exclusive: 0 });
    };

    /**
     * Open modal to create a new folder
     */
    $scope.createFolder = () => {
        openLabelModal({ Exclusive: 1 });
    };

    /**
     * Open modal to edit label / folder
     * @param {Object} label
     */
    $scope.editLabel = (label) => {
        openLabelModal(label);
    };

    $scope.sortLabels = () => {
        labelsEditorModel.sort();
        const order = labelsEditorModel.getOrder();
        labelsEditorModel.update();
        $scope.saveLabelOrder(order);
    };

    function getTitleDeleteLabel({ Exclusive }) {
        return (Exclusive) ? gettextCatalog.getString('Delete folder', null, 'Title') : gettextCatalog.getString('Delete label', null, 'Title');
    }

    function getMessageDeleteLabel({ Exclusive }) {
        return (Exclusive) ? gettextCatalog.getString('Are you sure you want to delete this folder? Messages in the folders aren’t deleted if the folder is deleted, they can still be found in all mail. If you want to delete all messages in a folder, move them to trash.', null, 'Info') : gettextCatalog.getString('Are you sure you want to delete this label? Removing a label will not remove the messages with that label.', null, 'Info');
    }

    $scope.deleteLabel = (label) => {
        const title = getTitleDeleteLabel(label);
        const message = getMessageDeleteLabel(label);
        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = Label.delete(label.ID)
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return Promise.resolve();
                        }
                        throw new Error(data.Error);
                    })
                    .then(() => eventManager.call())
                    .then(() => {
                        confirmModal.deactivate();
                        notify({ message: gettextCatalog.getString('Label deleted', null), classes: 'notification-success' });
                    });
                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.saveLabelOrder = (labelOrder) => {
        const promise = Label.order({ Order: labelOrder })
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                return eventManager.call()
                .then(() => {
                    notify({ message: gettextCatalog.getString('Label order saved', null), classes: 'notification-success' });
                });
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
        });

        networkActivityTracker.track(promise);
    };

    $scope.toggleDisplayLabel = (label) => {
        const promise = Label.update({ ID: label.ID, Name: label.Name, Color: label.Color, Display: Number(label.Display) })
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                return eventManager.call()
                .then(() => {
                    notify({ message: gettextCatalog.getString('Label edited', null), classes: 'notification-success' });
                });
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
        });

        networkActivityTracker.track(promise);
    };

    $scope.$on('$destroy', () => {
        labelsEditorModel.clear();
    });
});
