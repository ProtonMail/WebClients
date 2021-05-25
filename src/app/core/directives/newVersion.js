/* @ngInject */
function newVersion(dispatchers, AppModel, gettextCatalog) {
    const I18N = {
        version: gettextCatalog.getString('New version available', null, 'New version'),
        reload: gettextCatalog.getString('Reload Tab', null, 'New version')
    };

    return {
        restrict: 'A',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const update = (version) => {
                el[0].innerHTML = '';

                if (!version) {
                    return;
                }

                const a = document.createElement('a');
                a.textContent = I18N.reload;
                a.className = 'newVersion-link';
                a.dataset.action = 'reload';

                const p = document.createElement('p');
                p.textContent = I18N.version;
                p.className = 'newVersion-text';

                el[0].appendChild(p);
                el[0].appendChild(a);
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
