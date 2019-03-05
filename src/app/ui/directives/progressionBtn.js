/* @ngInject */
const progressionBtn = (dispatchers, gettextCatalog) => ({
    replace: true,
    templateUrl: require('../../../templates/ui/progressionBtn.tpl.html'),
    link(scope, el, { action = '', fileName }) {
        const { dispatcher, on, unsubscribe } = dispatchers(['attachment.upload']);

        el[0].querySelector('.sr-only').innerHTML = gettextCatalog.getString(
            'Remove the attachment {{fileName}}',
            { fileName },
            'Info'
        );
        el[0].setAttribute('data-label', action);

        const onClick = (e) => {
            e.stopPropagation();
            el[0].disabled = true;
            dispatcher['attachment.upload'](action, scope.model);
        };

        on('attachment.upload', (event, { type, data = {} }) => {
            if (type === 'remove.error' && data.id === scope.model.id) {
                el[0].disabled = false;
            }
        });

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
            unsubscribe();
        });
    }
});
export default progressionBtn;
