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
    Filter,
    incomingDefaults,
    networkActivityTracker,
    filterModal,
    filterAddressModal,
    notify,
    Setting
) {
    // Variables
    $scope.spamFilters = incomingDefaults;
    $scope.customFilters = [
        {
            "ID": "Ik65N-aChBuWFdo1JpmHJB4iWetfzjVLNILERQqbYFBZc5crnxOabXKuIMKhiwBNwiuogItetAUvkFTwJFJPQg==",
            "Name": "Updated",
            "Status": 1,
            "Data": "require [\"label\"];  if address :DOMAIN :is [\"From\", \"Delivered-To\"] \"protonmail.ch\" {     label \"mylabel\"; } else {     keep; }",
            "Version": 1
        }
    ];

    $scope.addCustomFilter = function() {
        filterModal.activate({
            params: {
                close: function() {
                    filterModal.deactivate();
                }
            }
        });
    };

    $scope.editCustomFilter = function(filter) {
        filterModal.activate({
            params: {
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

    $scope.enableCustomFilter = function(filter) {
        networkActivityTracker.track(
            Filter.enable(filter)
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {

                }
            })
        );
    };

    $scope.disableCustomFilter = function(filter) {
        networkActivityTracker.track(
            Filter.disable(filter)
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {

                }
            })
        );
    };

    /**
     * Check if the table filtered is empty
     * @param {Integer} folder
     * @return {Boolean}
     */
    $scope.empty = function(folder) {
        var filters = $filter('filter')($scope.spamFilters, {Location: folder});

        filter = $filter('filter')(filters, $scope.searchSpamFilter);

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
