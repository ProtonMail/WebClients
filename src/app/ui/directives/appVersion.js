import CONFIG from '../../config';

/* @ngInject */
function appVersion(releaseNotesModal) {
    const onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseNotesModal.activate();
    };
    return {
        replace: true,
        template: `<a data-prefix="v" href="${CONFIG.articleLink}" title="${CONFIG.date_version}" target="_blank" class="color-white hover-same-color nodecoration">v4.0.0</a>`,
        link(scope, element) {
            element.on('click', onClick);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default appVersion;
