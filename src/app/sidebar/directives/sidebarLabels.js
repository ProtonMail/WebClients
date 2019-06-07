/* @ngInject */
const sidebarLabels = (manageContactGroup, needUpgrade) => ({
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarLabels.tpl.html'),
    link(scope, el, { type }) {
        const unsubscribe = [];

        if (type === 'contact') {
            const onClick = (e) => {
                if (e.target.nodeName === 'A' || e.currentTarget.nodeName === 'A') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!needUpgrade()) {
                        manageContactGroup.edit(null, e.target.getAttribute('data-pt-dropzone-item'));
                    }
                }
            };
            el.on('click', onClick);
            unsubscribe.push(() => el.off('click', onClick));
        }

        scope.$on('$destroy', () => {
            unsubscribe.forEach((cb) => cb());
            unsubscribe.length = 0;
        });
    }
});
export default sidebarLabels;
