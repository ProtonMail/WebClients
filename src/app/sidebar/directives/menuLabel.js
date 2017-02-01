angular.module('proton.sidebar')
    .directive('menuLabel', ($rootScope, authentication, $stateParams, dedentTpl, $state, sidebarModel) => {

        const getClassName = (ID) => {
            const isActiveLabel = $stateParams.label === ID;
            return ['menuLabel-item', isActiveLabel && 'active']
                .filter(Boolean)
                .join(' ');
        };

        const template = ({ ID, Color, Name }) => {

            const className = getClassName(ID);
            const href = $state.href('secured.label', { label: ID });

            return dedentTpl(`<li class="${className}">
                <a href="${href}" title="${Name}" class="btn menuLabel-link">
                    <i class="fa fa-tag menuLabel-icon" style="color: ${Color || '#CCC'}"></i>
                    <span class="menuLabel-title">${Name}</span>
                    <em class="menuLabel-counter" data-label-id="${ID}"></em>
                </a>
            </li>`);
        };

        return {
            replace: true,
            template: '<ul class="menuLabel-container"></ul>',
            link(scope, el) {
                const unsubscribe = [];
                const updateCache = () => {
                    el[0].innerHTML = _.sortBy(authentication.user.Labels, 'Order')
                        .reduce((acc, label) => acc + template(label), '');
                };

                const updateCounter = () => {
                    _.each(el[0].querySelectorAll('.menuLabel-counter'), (node) => {
                        const id = node.getAttribute('data-label-id');
                        node.textContent = sidebarModel.unread('label', id);
                    });
                };

                updateCache();
                updateCounter();

                // Update the counter when we load then
                unsubscribe.push($rootScope.$on('app.cacheCounters', (e, { type }) => {
                    (type === 'load') && updateCounter();
                }));

                // Update the counter when we update it (too many updates if we update them via app.cacheCounters)
                unsubscribe.push($rootScope.$on('refreshElements', () => updateCounter()));
                unsubscribe.push($rootScope.$on('deleteLabel', () => updateCache()));
                unsubscribe.push($rootScope.$on('createLabel', () => updateCache()));
                unsubscribe.push($rootScope.$on('updateLabel', () => updateCache()));
                unsubscribe.push($rootScope.$on('updateLabels', () => updateCache()));

                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
