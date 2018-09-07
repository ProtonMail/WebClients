import _ from 'lodash';
import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function menuLabel(dispatchers, labelsModel, $stateParams, $state, sidebarModel) {
    const CLEANER = document.createElement('div');
    const getClassName = (ID) => {
        const isActiveLabel = $stateParams.label === ID;
        return ['menuLabel-item', isActiveLabel && 'active'].filter(Boolean).join(' ');
    };

    /**
     * Remove HTML inside a string, prevent XSS
     * @param  {String} s
     * @return {String}
     */
    const stripHTML = (s) => {
        CLEANER.textContent = s || '';
        return CLEANER.innerHTML;
    };

    const template = ({ ID, Color, Name, Exclusive }) => {
        const className = getClassName(ID);
        const href = $state.href('secured.label', { label: ID, sort: null, filter: null, page: null });
        const cleanName = stripHTML(Name);
        // Prevent XSS as we can break the title
        const cleanAttr = cleanName.replace(/"|'/g, '');

        const classIcon = Exclusive === 1 ? 'fa-folder' : 'fa-tag';

        return dedentTpl(`<li class="${className}">
                <a href="${href}" title="${cleanAttr}" data-label="${cleanAttr}" class="btn menuLabel-link" data-pt-dropzone-item="${ID}" data-pt-dropzone-item-type="label">
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
            const { on, unsubscribe } = dispatchers();
            const updateCache = () => {
                el[0].innerHTML = _.sortBy(labelsModel.get(), 'Order').reduce(
                    (acc, label) => acc + template(label),
                    ''
                );
            };

            const updateCounter = () => {
                _.each(el[0].querySelectorAll('.menuLabel-counter'), (node) => {
                    const id = node.getAttribute('data-label-id');
                    const $anchor = node.parentElement;
                    const total = sidebarModel.unread('label', id);
                    node.textContent = total;
                    $anchor.title = `${$anchor.getAttribute('data-label')} ${total}`.trim();
                });
            };

            const refresh = () => (updateCache(), updateCounter());

            // Update the counter when we load then
            on('app.cacheCounters', (e, { type }) => {
                type === 'load' && updateCounter();
            });

            // Update the counter when we update it (too many updates if we update them via app.cacheCounters)
            on('elements', (e, { type }) => {
                type === 'refresh' && updateCounter();
            });

            on('labelsModel', (e, { type }) => {
                if (type === 'cache.refresh' || type === 'cache.update') {
                    refresh();
                }
            });

            // Check the current state to set the current one as active
            on('$stateChangeSuccess', () => {
                _rAF(refresh);
            });

            updateCache();
            updateCounter();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default menuLabel;
