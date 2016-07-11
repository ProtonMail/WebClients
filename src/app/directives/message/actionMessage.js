angular.module('proton.message', [])
    .directive('actionMessage', function($rootScope, messageBuilder) {

        return {
            scope: {
                model: '=actionMessage'
            },
            link: function (scope, el, attr) {

                function onClick(e) {
                    e.preventDefault();

                    if ('addfile' === attr.actionMessageType) {
                        return $('#uid' + scope.model.uid).find('.dropzone').click();
                    }
                    var msg = messageBuilder.create(attr.actionMessageType, scope.model);
                    $rootScope.$emit('loadMessage', msg);
                }

                el.on('click', onClick);

                scope
                    .$on('$destroy', function() {
                        el.off('click', onClick);
                    });
            }
        };
    });