import { MESSAGE_FLAGS } from '../../constants';

const { FLAG_INTERNAL } = MESSAGE_FLAGS;

/* @ngInject */
function composerEncrypt(dispatchers, notification, gettextCatalog, translator) {

    const { dispatcher } = dispatchers(['composer.update']);
    const dispatch = (type, message) => dispatcher['composer.update'](type, { message, type: 'encryption' });

    const I18N = translator(() => ({
        noPassword: gettextCatalog.getString('Please enter a password for this email.', null, 'Error'),
        noMatchPassword: gettextCatalog.getString('Message passwords do not match.', null, 'Error')
    }));

    return {
        replace: true,
        scope: {
            message: '='
        },
        templateUrl: require('../../../templates/composer/composerEncrypt.tpl.html'),
        link(scope, el) {
            const $cancel = el.find('.composerEncrypt-btn-cancel');

            scope.model = {
                password: '',
                confirm: '',
                hint: ''
            };

            const onSubmit = (e) => {
                // We don't want to submit the whole composer
                e.stopPropagation();

                if (!scope.model.password.length) {
                    return notification.error(I18N.noPassword);
                }

                if (scope.model.password !== scope.model.confirm) {
                    return notification.error(I18N.noMatchPassword);
                }
                scope.$applyAsync(() => {
                    scope.message.addFlag(FLAG_INTERNAL);
                    scope.message.Password = scope.model.password;
                    scope.message.PasswordHint = scope.model.hint;
                    dispatch('close.panel', scope.message);
                });
            };

            const onCancel = () => {
                scope.$applyAsync(() => {
                    scope.model.password = '';
                    scope.model.confirm = '';
                    scope.model.hint = '';
                    scope.encryptForm.$setUntouched();
                    delete scope.message.Password;
                    delete scope.message.PasswordHint;
                    scope.message.removeFlag(FLAG_INTERNAL);
                    dispatch('close.panel', scope.message);
                });
            };

            el.on('submit', onSubmit);
            $cancel.on('click', onCancel);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
                $cancel.off('click', onCancel);
            });
        }
    };
}
export default composerEncrypt;
