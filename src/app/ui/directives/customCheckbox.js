angular.module('proton.ui')
    .directive('customCheckbox', (customInputCreator) => ({
        replace: true,
        terminal: false,
        property: 0,
        templateUrl: 'templates/ui/customCheckbox.tpl.html',
        compile: customInputCreator.checkableCompiler('checkbox')
    }));
