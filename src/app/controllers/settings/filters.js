angular.module("proton.controllers.Settings")

.controller('FiltersController', function(
    $log,
    $rootScope,
    $scope,
    CONSTANTS,
    $state,
    $window,
    gettextCatalog,
    $q,
    authentication,
    networkActivityTracker,
    Setting,
    incomingDefaults,
    IncomingDefault,
    notify
) {

    // Variables
    var lastChecked = null;

    $scope.defaults = incomingDefaults;
    $scope.locations = [
        { label: gettextCatalog.getString('Inbox', null), id: parseInt(CONSTANTS.MAILBOX_IDENTIFIERS.inbox) },
        { label: gettextCatalog.getString('Spam', null), id: parseInt(CONSTANTS.MAILBOX_IDENTIFIERS.spam) }
    ];

    $scope.clearDefaults = function() {
        networkActivityTracker.track(
            IncomingDefault.clear()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.defaults = [];
                    notify({
                        message: gettextCatalog.getString('Default incomming rules cleared', null),
                        classes: 'notification-success'
                    });
                }
            })
        );
    };

    $scope.refreshDefaults = function() {
        networkActivityTracker.track(
            IncomingDefault.get()
            .then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    $scope.defaults = result.data.IncomingDefaults;
                    notify({
                        message: gettextCatalog.getString('Default incomming rules refreshed', null),
                        classes: 'notification-success'
                    });
                }
            })
        );
    };

    $scope.initSelect = function(deflt) {
        console.log(deflt, _.findWhere($scope.locations, {id: deflt.Location}));
        deflt.destination = _.findWhere($scope.locations, {id: deflt.Location});
    };

    $scope.changeLocation = function() {

    };

    $scope.deleteSelectedDefaults = function() {
        var defaultsSelected = $scope.defaultsSelected();
        var deletedIDs = [];
        var deletedDefaults = [];

        _.forEach(defaultsSelected, function(deflt) {
            deletedIDs.push(deflt.ID.toString());
            deletedDefaults.push(deflt);
        });

        networkActivityTracker.track(
            IncomingDefault.delete({
                IDs : deletedIDs
            }).then(function(response) {
                notify({message: gettextCatalog.getString('Incomming defaults deleted', null, 'Info'), classes: 'notification-success'});
                // TODO: replace this with a smart comaprison of the IncomingDefaults array and the deletedDefaults arrays;

                $scope.defaults = $scope.defaults.filter(function(val) {
                    return deletedDefaults.indexOf(val) === -1;
                });

            }, function(error) {
                notify({message: error, classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.onSelectDefault = function(event, deflt) {
        if (!lastChecked) {
            lastChecked = deflt;
        } else {
            if (event.shiftKey) {
                var start = _.indexOf($scope.defaults, deflt);
                var end = _.indexOf($scope.defaults, lastChecked);

                _.each($scope.defaults.slice(Math.min(start, end), Math.max(start, end) + 1), function(deflt) {
                    deflt.selected = lastChecked.selected;
                });
            }

            lastChecked = deflt;
        }
    };

    $scope.defaultsSelected = function() {
        return _.filter($scope.defaults, function(deflt) {
            return deflt.selected === true;
        });
    };


});
