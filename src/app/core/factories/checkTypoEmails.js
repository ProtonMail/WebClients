angular.module('proton.core')
.factory('checkTypoEmails', () => {
    const addresses = [
        'prontonmail.',
        'protomail.',
        'protonmai.',
        'protonmsil.',
        'ptotonmail.'
    ].reduce((previousValue, currentValue) => previousValue.concat([currentValue + 'ch', currentValue + 'com']), []);
    /**
     * Check ProtonMail typo in email value
     * @param {String} email
     * @return {Boolean}
     */
    return (email = '') => {
        const splitter = email.split('@');
        if (splitter.length) {
            const domain = splitter[1];
            return addresses.indexOf(domain) > -1;
        }
        return false;
    };
});
