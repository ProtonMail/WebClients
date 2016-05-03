angular.module("proton.controllers.Settings")

.controller('FiltersController', function(
    $log,
    $q,
    $scope,
    CONSTANTS,
    gettextCatalog,
    IncomingDefault,
    incomingDefaults,
    networkActivityTracker,
    notify,
    Setting
) {
    // Variables
    var lastChecked = null;

    $scope.currentPage = 1;
    $scope.numPerPage = CONSTANTS.ELEMENTS_PER_PAGE;
    $scope.rules = incomingDefaults.slice(($scope.currentPage - 1) * $scope.numPerPage, ($scope.currentPage - 1) * $scope.numPerPage + $scope.numPerPage);
    $scope.totalItems = incomingDefaults.length;
    $scope.destinations = [
        { label: gettextCatalog.getString('Inbox', null), id: parseInt(CONSTANTS.MAILBOX_IDENTIFIERS.inbox) },
        { label: gettextCatalog.getString('Spam', null), id: parseInt(CONSTANTS.MAILBOX_IDENTIFIERS.spam) }
    ];

    $scope.clearDefaults = function() {
        networkActivityTracker.track(
            IncomingDefault.clear()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.rules = [];
                    notify({message: gettextCatalog.getString('Default incomming rules cleared', null), classes: 'notification-success'});
                }
            })
        );
    };

    $scope.refreshDefaults = function() {
        networkActivityTracker.track(
            IncomingDefault.get()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.rules = result.data.IncomingDefaults;
                    notify({message: gettextCatalog.getString('Default incomming rules refreshed', null), classes: 'notification-success'});
                }
            })
        );
    };

    $scope.initSelect = function(rule) {
        rule.destination = _.findWhere($scope.destinations, {id: rule.Location});
    };

    $scope.changeDestination = function(rule) {
        rule.Location = rule.destination.id;

        networkActivityTracker.track(
            IncomingDefault.update(rule)
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    angular.extend(rule, result.data.IncomingDefault);
                    notify({message: gettextCatalog.getString('Default incomming rule updated', null), classes: 'notification-success'});
                }
            })
        );
    };

    $scope.deleteSelectedDefaults = function() {
        var defaultsSelected = _.where($scope.rules, {selected: true});
        var deletedIDs = [];
        var deletedDefaults = [];

        _.forEach(defaultsSelected, function(rule) {
            deletedIDs.push(rule.ID.toString());
            deletedDefaults.push(rule);
        });

        networkActivityTracker.track(
            IncomingDefault.delete({
                IDs : deletedIDs
            }).then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    notify({message: gettextCatalog.getString('Incomming defaults deleted', null, 'Info'), classes: 'notification-success'});

                    // TODO: replace this with a smart comaprison of the IncomingDefaults array and the deletedDefaults arrays;
                    $scope.rules = $scope.rules.filter(function(val) {
                        return deletedDefaults.indexOf(val) === -1;
                    });
                }
            })
        );
    };

    $scope.onSelectDefault = function(event, rule) {
        if (!lastChecked) {
            lastChecked = rule;
        } else {
            if (event.shiftKey) {
                var start = _.indexOf($scope.rules, rule);
                var end = _.indexOf($scope.rules, lastChecked);

                _.each($scope.rules.slice(Math.min(start, end), Math.max(start, end) + 1), function(rule) {
                    rule.selected = lastChecked.selected;
                });
            }

            lastChecked = rule;
        }
    };

    $scope.selectPage = function(page) {
        $scope.currentPage = page;
        $scope.rules = incomingDefaults.slice(($scope.currentPage - 1) * $scope.numPerPage, ($scope.currentPage - 1) * $scope.numPerPage + $scope.numPerPage);
    };
});
