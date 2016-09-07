angular.module("proton.controllers.Settings")

.controller('FiltersController', function(
    $log,
    $q,
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
    notify,
    Setting
) {
    // Variables
    $scope.spamFilters = incomingDefaults;
    $scope.customFilters = customFilters;
    $scope.itemMoved = false;

    // Drag and Drop configuration
    $scope.filterDragControlListeners = {
        containment: '.pm_sort',
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        dragStart: function() {
            $scope.itemMoved = true;
        },
        dragEnd: function() {
            $scope.itemMoved = false;
        },
        orderChanged: function() {
            var order = [];

            _.each($scope.customFilters, function(filter, index) {
                order[index] = filter.Priority;
                filter.Priority = index + 1;
            });

            // Save priority order
            networkActivityTracker.track(
                Filter.order({Order: order})
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        notify({message: gettextCatalog.getString('Order saved', null, 'Info'), classes: 'notification-success'});
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    } else {
                        notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes : 'notification-danger'});
                    }
                })
            );
        }
    };

    $scope.$on('deleteFilter', function(event, filterId) {
        if ($scope.itemMoved === false) {
            var index = _.findIndex($scope.customFilters, {ID: filterId});

            if (index !== -1) {
                $scope.customFilters.splice(index, 1);
            }
        }
    });

    $scope.$on('createFilter', function(event, filterId, filter) {
        if ($scope.itemMoved === false) {
            var index = _.findIndex($scope.customFilters, {ID: filterId});

            if (index === -1) {
                $scope.customFilters.push(filter);
            } else {
                _.extend($scope.customFilters[index], filter);
            }
        }
    });

    $scope.$on('updateFilter', function(event, filterId, filter) {
        if ($scope.itemMoved === false) {
            var index = _.findIndex($scope.customFilters, {ID: filterId});

            if (index === -1) {
                $scope.customFilters.push(filter);
            } else {
                _.extend($scope.customFilters[index], filter);
            }
        }
    });

    $scope.addCustomFilter = function() {
        const activeCustomFilters = _.where($scope.customFilters, {Status: 1});

        if ($scope.isFree === true && activeCustomFilters.length === 1) {
            notify(gettextCatalog.getString('Free ProtonMail accounts are limited to 1 custom filter. Please <a href="/dashboard">upgrade</a> to get unlimited filters.', null, 'Info'));
        } else {
            filterModal.activate({
                params: {
                    mode: 'simple',
                    close: function() {
                        filterModal.deactivate();
                    }
                }
            });
        }
    };

    $scope.clearCustomFilters = function() {
        var title = gettextCatalog.getString('Clear All', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to clear all custom filters?', null, 'Info');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(
                        Filter.clear()
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                $scope.customFilters = [];
                                confirmModal.deactivate();
                                notify({message: gettextCatalog.getString('Custom filters cleared', null, 'Info'), classes: 'notification-success'});
                            } else if (result.data && result.data.Error) {
                                notify({message: result.data.Error, classes: 'notification-danger'});
                            }
                        })
                    );
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.editCustomFilter = function(filter) {
        filterModal.activate({
            params: {
                mode: (filter.Simple && Object.keys(filter.Simple).length) ? 'simple' : 'complex',
                filter: filter,
                close: function() {
                    filterModal.deactivate();
                }
            }
        });
    };

    $scope.deleteCustomFilter = function(filter) {
        var title = gettextCatalog.getString('Delete Filter', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to delete this filter?', null, 'Info');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(
                        Filter.delete(filter)
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                eventManager.call();
                                notify({message: gettextCatalog.getString('Custom filter deleted', null, 'Info'), classes: 'notification-success'});
                            } else if (result.data && result.data.Error) {
                                notify({message: result.data.Error, classes: 'notification-danger'});
                            }
                        })
                    );
                    confirmModal.deactivate();
                },
                cancel: function() {
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
                    notify({message: gettextCatalog.getString('Status updated', null, 'Info'), classes: 'notification-success'});
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
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
                    notify({message: gettextCatalog.getString('Status updated', null, 'Info'), classes: 'notification-success'});
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                    filter.Status = 1;
                }
            })
        );
    };

    $scope.statusCustomFilter = (filter) => {
        if (filter.Status === 0) {
            $scope.disableCustomFilter(filter);
        } else if (filter.Status === 1) {
            $scope.enableCustomFilter(filter);
        }
    };

    /**
     * Check if the table filtered is empty
     * @param {Integer} folder
     * @return {Boolean}
     */
    $scope.empty = function(folder) {
        var filters = $filter('filter')($scope.spamFilters, {Location: folder});

        filters = $filter('filter')(filters, $scope.searchSpamFilter);

        return filters.length === 0;
    };

    /**
     * Open a modal to a spam filter to a specific location
     * @param {Integer} folder
     */
    $scope.addSpamFilter = function(folder) {
        filterAddressModal.activate({
            params: {
                location: folder,
                add: function(filter) {
                    $scope.spamFilters.push(filter);
                    filterAddressModal.deactivate();
                    notify({message: gettextCatalog.getString('Spam Filter Added'), classes: 'notification-success'});
                },
                close: function() {
                    filterAddressModal.deactivate();
                }
            }
        });
    };

    /**
     * Delete a specific spam filter
     * @param {Object} filter
     */
    $scope.deleteSpamFilter = function(filter) {
        var IDs = [];

        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        IDs.push(filter.ID);

        networkActivityTracker.track(
            IncomingDefault.delete({IDs: IDs})
            .then(function(result) {
                if (result.data && result.data.Code === 1001) {
                    var index = $scope.spamFilters.indexOf(filter);

                    $scope.spamFilters.splice(index, 1);
                    notify({message: gettextCatalog.getString('Spam Filter Deleted'), classes: 'notification-success'});
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };

    /**
     * Move a filter to an other spam list
     * @param {Object} filter
     * @param {Integer} folder
     */
    $scope.switchSpamFilter = function(filter, folder) {
        var clone = angular.copy(filter);

        // Hide all the tooltip
        $('.tooltip').not(this).hide();
        clone.Location = folder;

        networkActivityTracker.track(
            IncomingDefault.update(clone)
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    angular.extend(filter, result.data.IncomingDefault);
                    notify({message: gettextCatalog.getString('Spam Filter Updated', null), classes: 'notification-success'});
                } else if (result.data && result.data.Error) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            })
        );
    };
});
