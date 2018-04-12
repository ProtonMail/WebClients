import _ from 'lodash';
import createScrollHelper from '../../../helpers/dragScrollHelper';

/* @ngInject */
function customFilterList(
    authentication,
    dispatchers,
    networkActivityTracker,
    Filter,
    gettextCatalog,
    notification,
    filterModal,
    confirmModal,
    eventManager
) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/customFilterList.tpl.html'),
        scope: {},
        link(scope) {
            const { on, unsubscribe } = dispatchers();
            scope.customFilters = null;

            const promise = Filter.query().then((data = {}) => {
                scope.customFilters = data.Filters;
            });

            networkActivityTracker.track(promise);

            on('changeCustomFilterStatus', (event, { id, status }) => {
                const filter = _.find(scope.customFilters, { ID: id });

                if (filter) {
                    changeCustomFilterStatus(filter, status);
                }
            });

            const { dragStart, dragMove, dragEnd } = createScrollHelper({
                scrollableSelector: '#pm_settings .settings'
            });
            // Drag and Drop configuration
            scope.filterDragControlListeners = {
                containment: '.pm_sort',
                accept(sourceItemHandleScope, destSortableScope) {
                    return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                },
                dragStart(event) {
                    dragStart(event);
                    scope.itemMoved = true;
                },
                dragMove,
                dragEnd() {
                    dragEnd();
                    scope.itemMoved = false;
                },
                orderChanged() {
                    const FilterIDs = _.map(scope.customFilters, 'ID');

                    _.each(scope.customFilters, (filter, index) => {
                        filter.Priority = index + 1;
                    });

                    // Save priority order
                    networkActivityTracker.track(
                        Filter.order({ FilterIDs })
                            .then(({ data = {} } = {}) => {
                                notification.success(gettextCatalog.getString('Order saved', null, 'Info'));
                                return data;
                            })
                            .catch(({ data = {} } = {}) => {
                                throw new Error(
                                    data.Error ||
                                        gettextCatalog.getString(
                                            'Unable to save your changes, please try again.',
                                            null,
                                            'Error'
                                        )
                                );
                            })
                    );
                }
            };

            scope.$on('$destroy', unsubscribe);

            scope.$on('deleteFilter', (event, filterId) => {
                if (!scope.itemMoved) {
                    const index = _.findIndex(scope.customFilters, { ID: filterId });

                    if (index !== -1) {
                        scope.customFilters.splice(index, 1);
                    }
                }
            });

            scope.$on('createFilter', (event, filterId, filter) => {
                if (!scope.itemMoved) {
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
                if (!scope.itemMoved) {
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
                const activeCustomFilters = _.filter(scope.customFilters, { Status: 1 });

                if (!authentication.hasPaidMail() && activeCustomFilters.length === 1) {
                    return notification.info(
                        gettextCatalog.getString(
                            'Free ProtonMail accounts are limited to 1 custom filter. Please <a href="/dashboard">upgrade</a> to get unlimited filters.',
                            null,
                            'Info'
                        )
                    );
                }

                filterModal.activate({
                    params: {
                        mode: 'simple',
                        close() {
                            filterModal.deactivate();
                        }
                    }
                });
            };

            scope.addSieveFilter = () => {
                const activeCustomFilters = _.filter(scope.customFilters, { Status: 1 });

                if (!authentication.hasPaidMail() && activeCustomFilters.length === 1) {
                    return notification.info(
                        gettextCatalog.getString(
                            'Free ProtonMail accounts are limited to 1 custom filter. Please <a href="/dashboard">upgrade</a> to get unlimited filters.',
                            null,
                            'Info'
                        )
                    );
                }

                filterModal.activate({
                    params: {
                        mode: 'complex',
                        close() {
                            filterModal.deactivate();
                        }
                    }
                });
            };

            scope.isSimple = (filter) => filter.Simple && Object.keys(filter.Simple).length;

            scope.editCustomFilter = function(filter, complex = false) {
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
                            const promise = Filter.delete(filter)
                                .then(eventManager.call)
                                .then(() => {
                                    notification.success(
                                        gettextCatalog.getString('Custom filter deleted', null, 'Info')
                                    );
                                });

                            networkActivityTracker.track(promise);
                            confirmModal.deactivate();
                        },
                        cancel() {
                            confirmModal.deactivate();
                        }
                    }
                });
            };

            scope.enableCustomFilter = (filter) => {
                const promise = Filter.enable(filter)
                    .then(() => {
                        notification.success(gettextCatalog.getString('Status updated', null, 'Info'));
                    })
                    .catch(({ data = {} } = {}) => {
                        filter.Status = 0;
                        throw new Error(data.Error);
                    });

                networkActivityTracker.track(promise);

                return promise;
            };

            scope.disableCustomFilter = (filter) => {
                const promise = Filter.disable(filter)
                    .then(({ data = {} }) => {
                        notification.success(gettextCatalog.getString('Status updated', null, 'Info'));
                        return data;
                    })
                    .catch(({ data = {} } = {}) => {
                        filter.Status = 1;
                        throw new Error(data.Error);
                    });

                networkActivityTracker.track(promise);

                return promise;
            };

            function changeCustomFilterStatus(filter, status) {
                filter.Status = status ? 1 : 0;

                if (filter.Status === 0) {
                    scope.disableCustomFilter(filter);
                } else if (filter.Status === 1) {
                    scope.enableCustomFilter(filter);
                }
            }
        }
    };
}
export default customFilterList;
