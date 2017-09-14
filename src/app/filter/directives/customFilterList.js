angular.module('proton.filter')
    .directive('customFilterList', ($rootScope, authentication, networkActivityTracker,
        Filter, gettextCatalog, notify, filterModal, confirmModal, eventManager, filterAddressModal,
        $filter, IncomingDefault) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/filter/customFilterList.tpl.html',
            scope: {},
            link(scope) {

                // Variables
                const unsubscribe = [];
                scope.customFilters = null;

                networkActivityTracker.track(
                    Filter.query().then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            return result.data.Filters;
                        }
                        throw new Error(result.data.Error);
                    })).then((result) => scope.customFilters = result);

                unsubscribe.push($rootScope.$on('changeCustomFilterStatus', (event, { id, status }) => {
                    const filter = _.findWhere(scope.customFilters, { ID: id });

                    if (filter) {
                        changeCustomFilterStatus(filter, status);
                    }
                }));

                // Drag and Drop configuration
                scope.filterDragControlListeners = {
                    containment: '.pm_sort',
                    accept(sourceItemHandleScope, destSortableScope) {
                        return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                    },
                    dragStart() {
                        scope.itemMoved = true;
                    },
                    dragEnd() {
                        scope.itemMoved = false;
                    },
                    orderChanged() {
                        const order = [];

                        _.each(scope.customFilters, (filter, index) => {
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

                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });

                scope.$on('deleteFilter', (event, filterId) => {
                    if (scope.itemMoved === false) {
                        const index = _.findIndex(scope.customFilters, { ID: filterId });

                        if (index !== -1) {
                            scope.customFilters.splice(index, 1);
                        }
                    }
                });

                scope.$on('createFilter', (event, filterId, filter) => {
                    if (scope.itemMoved === false) {
                        const index = _.findIndex(scope.customFilters, { ID: filterId });

                        if (index === -1) {
                            scope.customFilters.push(filter);
                        } else {
                            // We need to override everything so it loses the simple tag if the filter is not simple anymore
                            scope.customFilters[index] = filter;
                        }
                    }
                });

                scope.$on('updateFilter', (event, filterId, filter) => {
                    if (scope.itemMoved === false) {
                        const index = _.findIndex(scope.customFilters, { ID: filterId });

                        if (index === -1) {
                            scope.customFilters.push(filter);
                        } else {
                            // We need to override everything so it loses the simple tag if the filter is not simple anymore
                            scope.customFilters[index] = filter;
                        }
                    }
                });

                scope.addCustomFilter = () => {
                    const activeCustomFilters = _.where(scope.customFilters, { Status: 1 });

                    if (!authentication.hasPaidMail() && activeCustomFilters.length === 1) {
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

                scope.addSieveFilter = () => {
                    const activeCustomFilters = _.where(scope.customFilters, { Status: 1 });

                    if (!authentication.hasPaidMail() && activeCustomFilters.length === 1) {
                        notify(gettextCatalog.getString('Free ProtonMail accounts are limited to 1 custom filter. Please <a href="/dashboard">upgrade</a> to get unlimited filters.', null, 'Info'));
                    } else {
                        filterModal.activate({
                            params: {
                                mode: 'complex',
                                close() {
                                    filterModal.deactivate();
                                }
                            }
                        });
                    }
                };

                scope.isSimple = (filter) => filter.Simple && Object.keys(filter.Simple).length;

                scope.editCustomFilter = function (filter, complex = false) {
                    filterModal.activate({
                        params: {
                            mode: !complex && scope.isSimple(filter) ? 'simple' : 'complex',
                            filter,
                            close: function close() {
                                filterModal.deactivate();
                            }
                        }
                    });
                };

                scope.deleteCustomFilter = (filter) => {
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

                scope.enableCustomFilter = (filter) => {
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

                scope.disableCustomFilter = (filter) => {
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
                        scope.disableCustomFilter(filter);
                    } else if (filter.Status === 1) {
                        scope.enableCustomFilter(filter);
                    }
                }
            }
        };
    });
