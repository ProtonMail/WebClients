import _ from 'lodash';

import { AUTOCOMPLETE_MAX_RECIPIENTS } from '../../constants';

/* @ngInject */
function contactSelectorForm(gettextCatalog, notification) {
    const I18N = {
        invalidForm: gettextCatalog.getString('Invalid form', null, 'Error'),
        limitReached: gettextCatalog.getString('You have reached the max recipients ({{limit}}) per message', { limit: AUTOCOMPLETE_MAX_RECIPIENTS }, 'Error')
    };
    const LIMIT_REACHED_CLASS = 'contactSelectorForm-limit-reached';
    const NO_RECIPIENTS_CLASS = 'contactSelectorForm-no-recipients';
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/contact/contactSelectorForm.tpl.html'),
        link(scope, el) {
            // NOTE contactSelectorForm is used in contactSelectorModal and receive scope.ctrl from it

            const getRecipients = () => _.filter(scope.ctrl.list, { selected: true }).concat(scope.ctrl.others);
            const onReset = scope.ctrl.close;
            const onSubmit = () => {
                if (scope.selectorForm.$invalid) {
                    notification.error(I18N.invalidForm);
                    return;
                }

                scope.$applyAsync(() => {
                    const recipients = getRecipients();

                    if (recipients.length > AUTOCOMPLETE_MAX_RECIPIENTS) {
                        notification.error(I18N.limitReached);
                        return;
                    }

                    scope.ctrl.submit(recipients);
                });
            };

            const updateView = () => {
                const recipients = getRecipients();

                el[0].classList[recipients.length > AUTOCOMPLETE_MAX_RECIPIENTS ? 'add' : 'remove'](LIMIT_REACHED_CLASS);
                el[0].classList[!recipients.length ? 'add' : 'remove'](NO_RECIPIENTS_CLASS);
            };

            const onClick = ({ target }) => {
                const list = target.getAttribute('data-list');
                const index = target.getAttribute('data-index');

                switch (list) {
                    case 'others':
                        scope.$applyAsync(() => {
                            scope.ctrl.others.splice(index, 1);
                            updateView();
                        });
                        break;

                    case 'list':
                        scope.$applyAsync(() => {
                            const list = _.filter(scope.ctrl.list, { selected: true });
                            list[index].selected = false;
                            updateView();
                        });
                        break;
                    default:
                        break;
                }
            };

            el.on('submit', onSubmit);
            el.on('reset', onReset);
            el.on('click', onClick);

            scope.onCheck = () => updateView();

            updateView();

            scope.$on('$destoy', () => {
                el.off('submit', onSubmit);
                el.off('reset', onReset);
                el.off('click', onClick);
            });
        }
    };
}
export default contactSelectorForm;
