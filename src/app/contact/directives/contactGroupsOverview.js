import _ from 'lodash';

import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function contactGroupsOverview(contactGroupModel, contactEmails, dispatchers) {
    const toLabels = (list = []) => {
        return list.reduce((acc, id) => {
            const item = contactGroupModel.read(id, 'labels');
            item && acc.push(item);
            return acc;
        }, []);
    };

    /**
     * Generate a list item for a group, we create the tooltip from here
     * to prevent a watcher inside pt-tootlip, to reresh it if we change
     * the title.
     * @param  {String} options.Name  Group's name
     * @param  {String} options.Color Group's color
     * @return {Object}
     */
    const getTpl = ({ Name, Color = 'inherit' }) => {
        const li = document.createElement('LI');
        li.className = 'contactGroupsOverview-label';
        li.insertAdjacentHTML('beforeend', '<i aria-hidden="true" class="fa fa-users"></i>');
        li.style.color = Color;

        const tooltip = tooltipModel(li, { title: Name });
        return { li, tooltip };
    };

    /**
     * Create the list of groups + ellipsis
     * @param  {Element} node
     * @param  {Array} groups
     * @return {Array}        [...Function]
     */
    const makeHTML = (node, groups = []) => {
        const unsubscribe = [];
        node.innerHTML = '';
        groups.forEach((group) => {
            const { li, tooltip } = getTpl(group);
            unsubscribe.push(() => tooltip.dispose());
            node.appendChild(li);
        });
        node.insertAdjacentHTML('beforeend', '<i class="fa fa-ellipsis-h contactGroupsOverview-ellipsis" aria-hidden="true"></i>');
        return unsubscribe;
    };

    return {
        scope: {
            contact: '=',
            email: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactGroupsOverview.tpl.html'),
        link(scope, el, { limit = 3, type }) {
            const { on, unsubscribe } = dispatchers();
            const toolTips = [];
            const unsubscribeToolTips = () => {
                toolTips.forEach((cb) => {
                    cb();
                });
                toolTips.length = 0;
            };

            const getLabels = () => {
                const { LabelIDs = [] } = scope.contact || contactEmails.findEmail(scope.email) || {};
                return LabelIDs;
            };

            // Refresh tooltips + and register unsubscribe cb
            const render = (list = []) => {
                toolTips.push(...makeHTML(el[0], list));
            };

            const build = () => {
                unsubscribeToolTips();
                const LabelIDs = getLabels();
                // Check if there is custom labels
                if (LabelIDs.length) {
                    const labels = toLabels(LabelIDs, type);

                    if (limit !== 'none') {
                        const total = labels.length;
                        const list = total ? angular.copy(labels.slice(0, limit)) : [];

                        el[0].setAttribute('data-overflow', total > limit);
                        return render(list);
                    }

                    return render(labels);
                }
                return render();
            };

            const refresh = () => _.defer(build, 160);

            on('contacts', (e, { type }) => {
                (type === 'contactsUpdated') && refresh();
            });

            on('contactGroupModel', (e, { type = '' }) => {
                ['cache.refresh', 'cache.remove'].includes(type) && refresh();
            });

            build();

            scope.$on('$destroy', () => {
                unsubscribe();
                unsubscribeToolTips();
            });
        }
    };
}
export default contactGroupsOverview;
