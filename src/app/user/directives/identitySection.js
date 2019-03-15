import _ from 'lodash';

/* @ngInject */
function identitySection(
    addressesModel,
    editorModel,
    gettextCatalog,
    notification,
    signatureModel,
    tools,
    dispatchers,
    translator
) {
    const I18N = translator(() => ({
        SUCCESS_SAVE: gettextCatalog.getString('Name / Signature saved', null, "User's signature")
    }));
    const EDITOR_ID = 'signature';
    const MULTIPLE_ADDRESS_CLASS = 'identitySection-has-multiple-address';

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/identitySection.tpl.html'),
        link(scope, el) {
            const CACHE = {};
            const $form = el.find('[name="identityForm"]');

            const { on, unsubscribe } = dispatchers();

            const updateAddress = ({ ID, DisplayName, Signature } = {}) => {
                // Can happen for a user that does not have keys for an address.
                if (!ID) {
                    return;
                }

                const firstTime = !CACHE.ID;
                CACHE.ID = ID;

                const signature = tools.replaceLineBreaks(Signature);

                if (!firstTime) {
                    const { editor } = editorModel.find({ ID: EDITOR_ID });
                    editor.fireEvent('refresh', { Body: signature });
                    return scope.$applyAsync(() => {
                        scope.address = { DisplayName, Signature: signature };
                    });
                }

                scope.address = { DisplayName, Signature: signature };
            };

            const updateAddresses = () => {
                const { active = [] } = addressesModel.getActive(undefined, { Send: 1 });

                CACHE.addresses = active.slice();
                el[0].classList[CACHE.addresses.length > 1 ? 'add' : 'remove'](MULTIPLE_ADDRESS_CLASS);
            };

            const onSubmit = async () => {
                const { DisplayName, Signature } = scope.address;
                const config = {
                    ID: CACHE.ID,
                    DisplayName,
                    Signature
                };
                await signatureModel.save(config);
                notification.success(I18N.SUCCESS_SAVE);
                updateAddress(config);
            };

            $form.on('submit', onSubmit);

            on('addressSelection', (event, { type = '', data = {} }) => {
                if (type === 'change') {
                    updateAddress(_.find(CACHE.addresses, { ID: data.ID }));
                }
            });

            on('addressesModel', (e, { type = '' }) => {
                if (type === 'addresses.updated') {
                    updateAddresses();
                }
            });

            updateAddresses();
            updateAddress(CACHE.addresses[0], true);

            scope.$on('$destroy', () => {
                $form.off('submit', onSubmit);
                unsubscribe();
            });
        }
    };
}
export default identitySection;
