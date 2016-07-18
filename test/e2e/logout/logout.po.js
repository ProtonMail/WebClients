var LogoutPage = function() {
    var dropdown = element(by.css('[class="fa fa-user"]'));

    this.logout = function() {
        dropdown.click();
        var logout = element(by.css('[ng-click="logout()"]'));
        logout.click();
        browser.sleep(1000);
    };
};

module.exports = LogoutPage;
