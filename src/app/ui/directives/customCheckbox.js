angular.module('proton.ui')
    .directive('customCheckbox', (customInputCreator) => ({
        replace: true,
        templateUrl: 'templates/ui/customCheckbox.tpl.html',
        compile: customInputCreator('checkbox')
    }));
