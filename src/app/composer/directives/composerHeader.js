angular.module('proton.composer')
    .directive('composerHeader', () => ({
        replace: true,
        templateUrl: 'templates/directives/composer/composer-header.tpl.html',
        link(scope, el) {

            const onClick = (e) => e.stopPropagation();
            el.on('click', onClick);

            scope
                .$on('$destroy', () => {
                    el.off('click', onClick);
                });
        }
    }));
