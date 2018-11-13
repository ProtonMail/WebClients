import _ from 'lodash';

/* @ngInject */
function contactGroupsOverview(contactGroupModel, contactEmails, dispatchers) {
    const toLabels = (list = []) => {
        return list.reduce((acc, id) => {
            const item = contactGroupModel.read(id, 'labels');
            item && acc.push(item);
            return acc;
        }, []);
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

            scope.groups = [];
            scope.color = ({ Color: color = 'inherit' } = {}) => ({ color });

            const getLabels = () => {
                const { LabelIDs = [] } = scope.contact || contactEmails.findEmail(scope.email) || {};
                return LabelIDs;
            };

            scope.getName = ({ Name }) => Name;

            const build = () => {
                const LabelIDs = getLabels();
                // Check if there is custom labels
                if (LabelIDs.length) {
                    const labels = toLabels(LabelIDs, type);

                    if (limit !== 'none') {
                        const total = labels.length;
                        const list = total ? angular.copy(labels.slice(0, limit)) : [];

                        el[0].setAttribute('data-overflow', total > limit);
                        return (scope.groups = list);
                    }

                    return (scope.groups = angular.copy(labels));
                }
                scope.groups.length = 0;
            };

            on('contacts', (e, { type }) => {
                if (type === 'contactsUpdated') {
                    _.defer(() => scope.$applyAsync(build), 160);
                }
            });

            on('contactGroupModel', (e, { type = '' }) => {
                /^cache\.(refresh|remove)$/.test(type) && _.defer(() => scope.$applyAsync(build), 160);
            });

            build();

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactGroupsOverview;
