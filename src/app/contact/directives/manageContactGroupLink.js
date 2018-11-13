/* @ngInject */
function manageContactGroupLink(
    manageContactGroupModal,
    networkActivityTracker,
    contactGroupModel,
    contactGroupModal,
    needUpgrade
) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/manageContactGroupLink.tpl.html'),
        link(scope, el, { mode }) {
            const onClick = () => {
                if (mode === 'create') {
                    if (needUpgrade()) {
                        return;
                    }

                    return contactGroupModal.activate({
                        params: {
                            close() {
                                contactGroupModal.deactivate();
                                networkActivityTracker.track(contactGroupModel.load(true));
                            }
                        }
                    });
                }
                console.log('contactGroupModal');
                manageContactGroupModal.activate();
            };
            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default manageContactGroupLink;
