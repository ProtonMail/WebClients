var LoginPage = function() {
    var username = element(by.model('username'));
    var password = element(by.model('password'));
    var loginButton = element(by.id('login_btn'));

    // Help modal
    var openHelp = element(by.css('[ng-click="displayHelpModal()"]'));

    // Report bug modal
    var openBug = element(by.css('[ng-click="openReportModal()"]'));

    // Trouble link
    var v2 = element(by.css('[href="https://v2.protonmail.com/login"]'));

    // Signup link
    var signup = element(by.css('a.signUp'));

    // Back link
    var back = element(by.css('[href="https://protonmail.com"]'));

    this.login = function(log, pass) {
        username.sendKeys(log);
        password.sendKeys(pass);
        return loginButton.click();
    };

    this.openHelp = function() {
        openHelp.click();
    };

    this.openBug = function() {
        openBug.click();
    };

    this.v2 = function() {
        v2.click();
    };

    this.signup = function() {
        signup.click();
    };

    this.back = function() {
        back.click();
    };
};

module.exports = LoginPage;
