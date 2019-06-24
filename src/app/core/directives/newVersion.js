import dedent from '../../../helpers/dedent';

/* @ngInject */
function newVersion(dispatchers, AppModel, gettextCatalog) {
    const I18N = {
        version: (version) =>
            gettextCatalog.getString('New version {{ version }} available', { version }, 'New version'),
        reload: gettextCatalog.getString('Reload Tab', null, 'New version')
    };

    const template = (version) => {
        return dedent`<div class="block-info-standard">
            <p class="newVersion-txt">${I18N.version(version)}</p>
            <a data-action="reload" class="newVersion-link">${I18N.reload}</a>
        </div>`;
    };

    return {
        restrict: 'A',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const update = (version) => {
                el[0].innerHTML = '';

                if (!version) {
                    return el[0].setAttribute('hidden', true);
                }

                el[0].removeAttribute('hidden');
                el[0].innerHTML = template(version);
            };

            on('AppModel', (e, { type, data = {} }) => {
                type === 'newVersion' && update(data.value);
            });

            update(AppModel.get('newVersion'));

            const onClick = ({ target }) => {
                if (target.dataset.action === 'reload') {
                    window.location.reload();
                }
            };

            el[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                unsubscribe();
                el[0].removeEventListener('click', onClick);
            });
        }
    };
}

export default newVersion;
