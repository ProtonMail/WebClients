/* @ngInject */
const progressionBtn = (dispatchers) => ({
    replace: true,
    template: '<button type="button" class="progressionBtn-btn"><i class="fa fa-times"></i></button>',
    link(scope, el, { action = '' }) {
        const { dispatcher, on, unsubscribe } = dispatchers(['attachment.upload']);
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
