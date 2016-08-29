angular.module('proton.ui')
.filter('chevrons', () => {
    return (input) => {
        return input.replace('›', '>').replace('‹', '<');
    };
});
