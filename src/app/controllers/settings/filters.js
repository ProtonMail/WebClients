angular.module('proton.controllers.Settings')

.controller('FiltersController', (
    $log,
    $q,
    $rootScope,
    $filter,
    $scope,
    CONSTANTS,
    gettextCatalog,
    IncomingDefault,
    confirmModal,
    eventManager,
    Filter,
    customFilters,
    incomingDefaults,
    networkActivityTracker,
    filterModal,
    filterAddressModal,
    notify
) => {
    // Variables
    const unsubscribe = [];
    $scope.spamFilters = incomingDefaults;
    $scope.customFilters = customFilters;
    $scope.itemMoved = false;

    customFilters.forEach((filter) => {
        unsubscribe.push($rootScope.$on('changeCustomFilterStatus.' + filter.ID, (event, status) => {
            changeCustomFilterStatus(filter, status);
        }));
    });

    // Drag and Drop configuration
    $scope.filterDragControlListeners = {
        containment: '.pm_sort',
        accept(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        dragStart() {
            $scope.itemMoved = true;
        },
        dragEnd() {
            $scope.itemMoved = false;
        },
        orderChanged() {
            const order = [];

            _.each($scope.customFilters, (filter, index) => {
                order[index] = filter.Priority;
                filter.Priority = index + 1;
            });

            // Save priority order
            networkActivityTracker.track(
                Filter.order({ Order: order })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        notify({ message: gettextCatalog.getString('Order saved', null, 'Info'), classes: 'notification-success' });
                    } else if (result.data && result.data.Error) {
                        notify({ message: result.data.Error, classes: 'notification-danger' });
                    } else {
                        notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                    }
                })
            );
        }
    };

    $rootScope.$on('$destroy', () => {
        unsubscribe.forEach((cb) => cb());
        unsubscribe.length = 0;
    });

    $scope.$on('deleteFilter', (event, filterId) => {
        if ($scope.itemMoved === false) {
            const index = _.findIndex($scope.customFilters, { ID: filterId });

            if (index !== -1) {
                $scope.customFilters.splice(index, 1);
            }
        }
    });

    $scope.$on('createFilter', (event, filterId, filter) => {
        if ($scope.itemMoved === false) {
            const index = _.findIndex($scope.customFilters, { ID: filterId });

            if (index === -1) {
                $scope.customFilters.push(filter);
            } else {
                _.extend($scope.customFilters[index], filter);
            }
        }
    });

    $scope.$on('updateFilter', (event, filterId, filter) => {
        if ($scope.itemMoved === false) {
            const index = _.findIndex($scope.customFilters, { ID: filterId });

            if (index === -1) {
                $scope.customFilters.push(filter);
            } else {
                _.extend($scope.customFilters[index], filter);
            }
        }
    });

    $scope.addCustomFilter = () => {
        const activeCustomFilters = _.where($scope.customFilters, { Status: 1 });

        if ($scope.isFree === true && activeCustomFilters.length === 1) {
            notify(gettextCatalog.getString('Free ProtonMail accounts are limited to 1 custom filter. Please <a href="/dashboard">upgrade</a> to get unlimited filters.', null, 'Info'));
        } else {
            filterModal.activate({
                params: {
                    mode: 'simple',
                    close() {
                        filterModal.deactivate();
                    }
                }
            });
        }
    };

    $scope.clearCustomFilters = () => {
        const title = gettextCatalog.getString('Clear All', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to clear all custom filters?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Filter.clear()
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                $scope.customFilters = [];
                                confirmModal.deactivate();
                                notify({ message: gettextCatalog.getString('Custom filters cleared', null, 'Info'), classes: 'notification-success' });
                            } else if (result.data && result.data.Error) {
                                notify({ message: result.data.Error, classes: 'notification-danger' });
                            }
                        })
                    );
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.editCustomFilter = (filter) => {
        filterModal.activate({
            params: {
                mode: (filter.Simple && Object.keys(filter.Simple).length) ? 'simple' : 'complex',
                filter,
                close() {
                    filterModal.deactivate();
                }
            }
        });
    };

    $scope.deleteCustomFilter = (filter) => {
        const title = gettextCatalog.getString('Delete Filter', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to delete this filter?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Filter.delete(filter)
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                eventManager.call();
                                notify({ message: gettextCatalog.getString('Custom filter deleted', null, 'Info'), classes: 'notification-success' });
                            } else if (result.data && result.data.Error) {
                                notify({ message: result.data.Error, classes: 'notification-danger' });
                            }
                        })
                    );
                    confirmModal.deactivate();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.enableCustomFilter = (filter) => {
        return networkActivityTracker.track(
            Filter.enable(filter)
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    notify({ message: gettextCatalog.getString('Status updated', null, 'Info'), classes: 'notification-success' });
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                    filter.Status = 0;
                }
            })
        );
    };

    $scope.disableCustomFilter = (filter) => {
        return networkActivityTracker.track(
            Filter.disable(filter)
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    notify({ message: gettextCatalog.getString('Status updated', null, 'Info'), classes: 'notification-success' });
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                    filter.Status = 1;
                }
            })
        );
    };

    function changeCustomFilterStatus(filter, status) {
        filter.Status = (status) ? 1 : 0;

        if (filter.Status === 0) {
            $scope.disableCustomFilter(filter);
        } else if (filter.Status === 1) {
            $scope.enableCustomFilter(filter);
        }
    }

    /**
     * Check if the table filtered is empty
     * @param {Integer} folder
     * @return {Boolean}
     */
    $scope.empty = (folder) => {
        let filters = $filter('filter')($scope.spamFilters, { Location: folder });
        filters = $filter('spam')(filters, $scope.searchSpamFilter);
        return filters.length === 0;
    };

    /**
     * Open a modal to a spam filter to a specific location
     * @param {Integer} folder
     */
    $scope.addSpamFilter = (folder) => {
        filterAddressModal.activate({
            params: {
                location: folder,
                add(filter) {
                    $scope.spamFilters.push(filter);
                    filterAddressModal.deactivate();
                    notify({ message: gettextCatalog.getString('Spam Filter Added'), classes: 'notification-success' });
                },
                close() {
                    filterAddressModal.deactivate();
                }
            }
        });
    };

    /**
     * Delete a specific spam filter
     * @param {Object} filter
     */
    $scope.deleteSpamFilter = (filter) => {
        const IDs = [];

        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        IDs.push(filter.ID);

        networkActivityTracker.track(
            IncomingDefault.delete({ IDs })
            .then((result) => {
                if (result.data && result.data.Code === 1001) {
                    const index = $scope.spamFilters.indexOf(filter);

                    $scope.spamFilters.splice(index, 1);
                    notify({ message: gettextCatalog.getString('Spam Filter Deleted'), classes: 'notification-success' });
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                }
            })
        );
    };

    /**
     * Move a filter to an other spam list
     * @param {Object} filter
     * @param {Integer} folder
     */
    $scope.switchSpamFilter = (filter, folder) => {
        const clone = angular.copy(filter);

        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        clone.Location = folder;

        networkActivityTracker.track(
            IncomingDefault.update(clone)
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    angular.extend(filter, result.data.IncomingDefault);
                    notify({ message: gettextCatalog.getString('Spam Filter Updated', null), classes: 'notification-success' });
                } else if (result.data && result.data.Error) {
                    notify({ message: result.data.Error, classes: 'notification-danger' });
                }
            })
        );
    };
});
