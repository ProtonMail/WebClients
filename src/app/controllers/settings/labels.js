angular.module("proton.controllers.Settings")

.controller('LabelsController', function($rootScope, $scope, authentication, labelModal) {
    $scope.labels = authentication.user.Labels;

    // Drag and Drop configuration
    $scope.aliasDragControlListeners = {
        containment: "form[name='aliasesForm']",
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged: function() {
          aliasOrder = [];
          _.forEach($scope.aliases, function(d,i) {
            aliasOrder[i] = d.Send;
          });
          $scope.saveAliases(aliasOrder);
        }
    };

    $scope.labelsDragControlListeners = {
        containment: "#labelContainer",
        accept: function(sourceItemHandleScope, destSortableScope) {
            return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        orderChanged: function() {
          labelOrder = [];
          _.forEach($scope.labels, function(d,i) {
            labelOrder[i] = d.Order;
            d.Order = i;
          });
          $scope.saveLabelOrder(labelOrder);
        }
    };

    // Listeners
    $scope.$on('updateLabels', $scope.updateLabels);

    // Functions
    $scope.updateLabels = function () {
        $scope.labels = authentication.user.Labels;
    };

    $scope.createLabel = function() {
        $rootScope.$broadcast('createLabel');
    };

    $scope.editLabel = function(label) {
        var origName = label.Name;
        var origColor = label.Color;

        labelModal.activate({
            params: {
                title: $translate.instant('EDIT_LABEL'),
                label: label,
                create: function(name, color) {
                    labelModal.deactivate();
                    networkActivityTracker.track(
                        Label.update({
                            id: label.ID,
                            Name: name,
                            Color: color,
                            Display: label.Display
                        }).$promise.then(function(result) {
                            if (result.Error) {
                                notify({message: result.Error, classes: 'notification-danger'});
                                label.Name = origName;
                                label.Color = origColor;
                            } else {
                                label.Color = color;
                                label.Name = name;
                                notify({message: $translate.instant('LABEL_EDITED'), classes: 'notification-success'});
                            }
                        }, function(error) {
                            notify({message: 'Error during the label edition request', classes: 'notification-danger'});
                            $log.error(error);
                        })
                    );
                },
                cancel: function() {
                    label.Name = origName;
                    label.Color = origColor;
                    labelModal.deactivate();
                }
            }
        });
    };

    $scope.deleteLabel = function(label) {
        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_LABEL'),
                message: 'Are you sure you want to delete this label?', // TODO translate
                confirm: function() {
                    networkActivityTracker.track(
                        Label.delete({id: label.ID}).$promise
                        .then(
                            function(result) {
                                if (result.Code === 1000) {
                                    confirmModal.deactivate();
                                    notify({message: $translate.instant('LABEL_DELETED'), classes: 'notification-success'});
                                    authentication.user.Labels = _.without(authentication.user.Labels, label);
                                    $scope.labels = authentication.user.Labels;
                                    $rootScope.$broadcast('updateLabels');
                                } else if(result.Error) {
                                    notify({message: result.Error, classes: 'notification-danger'});
                                    $log.error(result);
                                }
                            },
                            function(error) {
                                notify({message: 'Error during the label deletion request ', classes: 'notification-danger'});
                                $log.error(error);
                            }
                        )
                    );
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.saveLabelOrder = function(labelOrder) {
        networkActivityTracker.track(
            Label.order({
                "Order": labelOrder
            }).$promise.then(function(response) {
                if (response.Code === 1000) {
                    notify({message: $translate.instant('LABEL_ORDER_SAVED'), classes: 'notification-success'});
                } else if (response.Error) {
                    notify({message: response.Error, classes: 'notification-danger'});
                    $log.error(response);
                }
            }, function(error) {
                notify({message: 'Error during the label edition request ', classes: 'notification-danger'});
                $log.error(error);
            })
        );
    };

    $scope.toggleDisplayLabel = function(label) {
        Label.update({
            id: label.ID,
            Name: label.Name,
            Color: label.Color,
            Display: Number(label.Display)
        }).$promise.then(function(result) {
            if (result.Code === 1000) {
                notify({message: $translate.instant('LABEL_EDITED'), classes: 'notification-success'});
            } else if (result.Error) {
                notify({message: result.Error, classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: 'Error during the label edition request ', classes: 'notification-danger'});
            $log.error(error);
        });
    };
});
