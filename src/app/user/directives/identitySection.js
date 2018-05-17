import _ from 'lodash';

/* @ngInject */
function identitySection(
    addressesModel,
    authentication,
    editorModel,
    gettextCatalog,
    notification,
    signatureModel,
    tools,
    dispatchers
) {
    const I18N = {
        SUCCESS_SAVE: gettextCatalog.getString('Name / Signature saved', null, "User's signature")
    };
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

            const updateAddress = ({ ID, DisplayName, Signature }, firstTime = false) => {
                const signature = tools.replaceLineBreaks(Signature);

                CACHE.ID = ID;

                if (!firstTime) {
                    const { editor } = editorModel.find({ ID: EDITOR_ID });
                    editor.fireEvent('refresh', { Body: signature });
                    return scope.$applyAsync(() => {
                        scope.address = { DisplayName, Signature: signature };
                    });
                }

                scope.address = { DisplayName, Signature: signature };
            };

            const updateAddresses = (addresses = addressesModel.get()) => {
                CACHE.addresses = addresses.slice();
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
                    const address = _.find(CACHE.addresses, { ID: data.ID });

                    if (address) {
                        scope.$applyAsync(() => {
                            updateAddress(address);
                        });
                    }
                }
            });

            on('addressesModel', (e, { type = '', data = {} }) => {
                if (type === 'addresses.updated') {
                    updateAddresses(data.addresses);
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
