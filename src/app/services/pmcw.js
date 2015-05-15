angular.module("proton.pmcw", [])

// Proton Mail Crypto Wrapper
.provider("pmcw", function pmcwProvider() {
    var pmcrypto = pmcrypto || {};

    this.mailboxPassword;

    this.setMailboxPassword = function(password) {
        this.mailboxPassword = password;
    };

    this.$get = function($q) {
        return pmcrypto;
    };
});
