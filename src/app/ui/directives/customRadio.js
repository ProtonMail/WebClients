angular.module('proton.ui')
    .directive('customRadio', (customInputCreator) => ({
        replace: true,
        templateUrl: 'templates/ui/customRadio.tpl.html',
        compile: customInputCreator('radio')
    }));
