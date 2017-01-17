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
    labelsModel,
    notify
) => {
    // Variables
    const unsubscribe = [];

    $scope.labels = labelsModel.load();

    // Drag and Drop configuration
    $scope.labelsDragControlListeners = {
        containment: '#labelContainer',
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged() {
            const order = labelsModel.getOrder();
            labelsModel.update();
            $scope.saveLabelOrder(order);
        }
    };

    // Listeners
    unsubscribe.push($rootScope.$on('deleteLabel', () => {
        $scope.$applyAsync(() => {
            $scope.labels = labelsModel.load();
        });
    }));

    unsubscribe.push($rootScope.$on('createLabel', () => {
        $scope.$applyAsync(() => {
            $scope.labels = labelsModel.load();
        });
    }));

    unsubscribe.push($rootScope.$on('updateLabel', () => {
        $scope.$applyAsync(() => {
            $scope.labels = labelsModel.load();
        });
    }));

    unsubscribe.push($rootScope.$on('updateLabels', () => {
        $scope.$applyAsync(() => {
            $scope.labels = labelsModel.load();
        });
    }));

    $scope.$on('$destroy', () => {
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });

    /**
     * Open modal to create a new label
     */
    $scope.createLabel = () => {
        labelModal.activate({
            params: {
                title: gettextCatalog.getString('Create new label', null, 'Title'),
                create(name, color) {
                    const promise = Label.create({ Name: name, Color: color, Display: 1 })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return eventManager.call()
                            .then(() => {
                                labelModal.deactivate();
                                notify({ message: gettextCatalog.getString('Label created', null), classes: 'notification-success' });
                            });
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                    });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    labelModal.deactivate();
                }
            }
        });
    };

    $scope.editLabel = (label) => {
        labelModal.activate({
            params: {
                title: gettextCatalog.getString('Edit label', null, 'Title'),
                label,
                create(name, color) {
                    const promise = Label.update({ ID: label.ID, Name: name, Color: color, Display: label.Display })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return eventManager.call()
                            .then(() => {
                                labelModal.deactivate();
                                notify({ message: gettextCatalog.getString('Label edited', null), classes: 'notification-success' });
                            });
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                    });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    labelModal.deactivate();
                }
            }
        });
    };

    $scope.deleteLabel = (label) => {
        confirmModal.activate({
            params: {
                title: gettextCatalog.getString('Delete label', null, 'Title'),
                message: gettextCatalog.getString('Are you sure you want to delete this label?', null, 'Info'),
                confirm() {
                    const promise = Label.delete(label.ID)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return eventManager.call()
                            .then(() => {
                                confirmModal.deactivate();
                                notify({ message: gettextCatalog.getString('Label deleted', null), classes: 'notification-success' });
                            });
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
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
        labelsModel.clear();
    });
});
