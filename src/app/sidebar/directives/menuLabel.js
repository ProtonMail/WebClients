angular.module('proton.sidebar')
    .directive('menuLabel', ($rootScope, labelsModel, $stateParams, dedentTpl, $state, sidebarModel) => {

        const getClassName = (ID) => {
            const isActiveLabel = $stateParams.label === ID;
            return ['menuLabel-item', isActiveLabel && 'active']
                .filter(Boolean)
                .join(' ');
        };

        const stripHTML = (s) => {
            const holder = document.createElement('div');
            holder.innerText = s;
            return holder.innerHTML;
        };

        const template = ({ ID, Color, Name, Exclusive }) => {

            const className = getClassName(ID);
            const href = $state.href('secured.label', { label: ID, sort: null, filter: null, page: null });
            const cleanName = stripHTML(Name);
            const classIcon = (Exclusive === 1) ? 'fa-folder' : 'fa-tag';

            return dedentTpl(`<li class="${className}">
                <a href="${href}" title="${cleanName}" class="btn menuLabel-link">
                    <i class="fa ${classIcon} menuLabel-icon" style="color: ${Color || '#CCC'}"></i>
                    <span class="menuLabel-title">${cleanName}</span>
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
                    el[0].innerHTML = _.sortBy(labelsModel.get(), 'Order')
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
                const refresh = () => (updateCache(), updateCounter());

                // Update the counter when we load then
                unsubscribe.push($rootScope.$on('app.cacheCounters', (e, { type }) => {
                    (type === 'load') && updateCounter();
                }));

                // Update the counter when we update it (too many updates if we update them via app.cacheCounters)
                unsubscribe.push($rootScope.$on('elements', (e, { type }) => {
                    (type === 'refresh') && updateCounter();
                }));

                unsubscribe.push($rootScope.$on('labelsModel', (e, { type }) => {
                    if (type === 'cache.refesh' || type === 'cache.update') {
                        refresh();
                    }
                }));

                // Check the current state to set the current one as active
                unsubscribe.push($rootScope.$on('$stateChangeSuccess', () => {
                    _rAF(refresh);
                }));


                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
