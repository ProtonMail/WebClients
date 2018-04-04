/* @ngInject */
const messageSignatureStatus = () => ({
    replace: true,
    templateUrl: require('../../../templates/message/messageSignatureStatus.tpl.html'),
    link(scope, el) {
        const onClick = (e) => {
            e.stopPropagation();
        };

        el.on('click', onClick);
        el.on('mouseup', onClick);
        el.on('touchend', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
            el.off('mouseup', onClick);
            el.off('touchend', onClick);
        });
    }
});
export default messageSignatureStatus;
