describe('Proton Mail App', function() {
    var timeToSleep = 2000; // 2 sec

    browser.get('http://localhost:8080/login');

    beforeEach(function() {
        browser.sleep(timeToSleep);
    });

    it('should log in', function() {
        var usernameInput = element(by.model('username'));
        var passwordInput = element(by.model('password'));
        var loginButton = element(by.id('login_btn'));

        expect(usernameInput).toBeDefined();
        expect(passwordInput).toBeDefined();
        expect(loginButton).toBeDefined();

        usernameInput.sendKeys('qatest1');
        // TODO test input value
        passwordInput.sendKeys('qatest1');
        // TODO test input value
        loginButton.click();
    });

    it('should unlock', function() {
        var passwordInput = element(by.model('mailboxPassword'));
        var unlockButton = element(by.id('enck'));

        expect(passwordInput).toBeDefined();
        expect(unlockButton).toBeDefined();

        passwordInput.sendKeys('qatest1');
        // TODO test input value
        unlockButton.click();
    });

    it('should switch to drafts folder', function() {
        var draftsButton;
        var buttons = element.all(by.css('#topMenu .list-group-item .btn'));

        expect(buttons).toEqual(jasmine.any(Array));
        expect(buttons.length).toBe(4);

        draftsButton = buttons[1];

        expect(draftsButton).toBeDefined();

        draftsButton.click();
    });


});
