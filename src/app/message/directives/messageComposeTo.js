angular.module('proton.message')
    .directive('messageComposeTo', ($rootScope, Message) => ({
        replace: true,
        template: '<button class="fa fa-pencil messageComposeTo-container" pt-tooltip-translate="Compose to"></button>',
        link(scope, el, { key }) {

            const onClick = () => {
                const message = new Message();
                const model = (key) ? scope.message[key] : scope.email;
                message.ToList = [model];
                $rootScope.$emit('composer.new', { message, type: 'new' });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    }));
