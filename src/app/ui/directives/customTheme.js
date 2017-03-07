angular.module('proton.ui')
    .directive('customTheme', () => ({
        replace: true,
        template: '<style id="customTheme">{{ user.Theme }}</style>'
    }));
