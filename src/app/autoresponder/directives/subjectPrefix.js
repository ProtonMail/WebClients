angular.module('proton.autoresponder')
    .directive('subjectPrefix', ($rootScope, autoresponderModel) => {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/autoresponder/subjectPrefix.tpl.html',
            scope: {},
            link(scope, elem, { subject, disableInput }) {
                const unsubscribe = [];
                if (disableInput === 'true') {
                    elem.attr('disabled', 'disabled');
                }

                const model = {};
                model.subject = subject;
                elem[0].value = model.subject;

                unsubscribe.push($rootScope.$on('autoresponder', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        model.subject = data.autoresponder.subject;
                        elem[0].value = model.subject;
                    }
                }));

                /*
                    colons are not allowed in the subject prefix. You can't do 'auto: blaba' as a prefix is always ended by a colon.
                 */
                function onChange() {
                    scope.$applyAsync(() => {
                        model.subject = elem[0].value;
                        model.subject = model.subject.replace(/[:].*$/gi, '');
                        elem[0].value = model.subject;
                        autoresponderModel.set({ subject: model.subject });
                    });
                }

                /*
                    Also do this on key up to be able to respond without the delay that happens with on 'change'
                 */
                function onKeyup() {
                    scope.$applyAsync(() => {
                        if (scope.subject.indexOf(':') !== -1) {
                            model.subject = elem[0].value;
                            model.subject = model.subject.replace(/[:].*$/gi, '');
                            elem[0].value = model.subject;
                        }
                    });
                }

                function onKeydown(e) {
                    if (e.key === ':') {
                        e.preventDefault();
                    }
                }

                elem.on('keydown', onKeydown);
                unsubscribe.push(() => elem.off('keydown', onKeydown));

                elem.on('keyup', onKeyup);
                unsubscribe.push(() => elem.off('keyup', onKeyup));

                elem.on('change', onChange);
                unsubscribe.push(() => elem.off('change', onChange));

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
