angular.module('proton.message')
    .filter('nameRecipient', () => {
        return (Name = '') => Name.includes(',') ? `"${Name}"` : Name;
    });
