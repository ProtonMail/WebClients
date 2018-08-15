/* @ngInject */
const messageComposeTo = (dispatchers, messageModel) => ({
    replace: true,
    template: '<button class="fa fa-pencil messageComposeTo-container" pt-tooltip-translate="Compose to"></button>',
    link(scope, el, { key }) {
        const { dispatcher } = dispatchers(['composer.new']);
        const onClick = () => {
            const message = messageModel();
            const model = key ? scope.message[key] : scope.email;
            message.ToList = [model];
            dispatcher['composer.new']('new', { message });
        };

        el.on('click', onClick);

        scope.$on('$destroy', () => {
            el.off('click', onClick);
        });
    }
});
export default messageComposeTo;
