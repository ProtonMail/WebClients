var UnlockPage = function() {
    this.password = element(by.model('mailboxPassword'));
    this.button = element(by.id('unlock_btn'));
};

module.exports = UnlockPage;
