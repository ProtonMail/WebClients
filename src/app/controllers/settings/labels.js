angular.module("proton.controllers.Settings")

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
    notify
) => {
    // Variables
    const unsubscribe = [];
    let labelOrder = [];

    $scope.labels = _.sortBy(authentication.user.Labels, 'Order');

    // Drag and Drop configuration
    $scope.labelsDragControlListeners = {
        containment: '#labelContainer',
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged() {
            labelOrder = [];

            $scope.labels.forEach((label, index) => {
                labelOrder[index] = label.Order;
                label.Order = index + 1;
            });

            $scope.saveLabelOrder(labelOrder);
        }
    };

    // Listeners
    unsubscribe.push($rootScope.$on('deleteLabel', (event, ID) => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    unsubscribe.push($rootScope.$on('createLabel', (event, ID, label) => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    unsubscribe.push($rootScope.$on('updateLabel', (event, ID, label) => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    unsubscribe.push($rootScope.$on('updateLabels', (event) => {
        $scope.$applyAsync(() => {
            $scope.labels = _.sortBy(authentication.user.Labels, 'Order');
        });
    }));

    $scope.$on('$destroy', () => {
        unsubscribe.forEach(cb => cb());
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
                                notify({message: gettextCatalog.getString('Label created', null), classes: 'notification-success'});
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
                label: label,
                create(name, color) {
                    const promise = Label.update({ ID: label.ID, Name: name, Color: color, Display: label.Display })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return eventManager.call()
                            .then(() => {
                                labelModal.deactivate();
                                notify({message: gettextCatalog.getString('Label edited', null), classes: 'notification-success'});
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
                                notify({message: gettextCatalog.getString('Label deleted', null), classes: 'notification-success'});
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
                    notify({message: gettextCatalog.getString('Label order saved', null), classes: 'notification-success'});
                });
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
        });

        networkActivityTracker.track(promise);
    };

    $scope.toggleDisplayLabel = (label) => {
        const promise = Label.update({ ID: label.ID, Name: label.Name, Color: label.Color, Display: Number(label.Display)})
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                return eventManager.call()
                .then(() => {
                    notify({message: gettextCatalog.getString('Label edited', null), classes: 'notification-success'});
                });
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
        });

        networkActivityTracker.track(promise);
    };
});
