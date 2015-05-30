describe('Proton Mail App', function() {
    var ptor = protractor.getInstance();
    var timeToSleep = 2000; // 2 sec

    ptor.get('http://localhost:8080/login');

    beforeEach(function() {
        ptor.sleep(timeToSleep);
    });

    it('should log in', function() {
        element(by.model('username')).sendKeys('richard');
        element(by.model('password')).sendKeys('richard');
        element(by.id('login_btn')).click();
    });

    it('should unlock', function() {
        element(by.model('mailboxPassword')).sendKeys('richard');
        element(by.id('enck')).click();
    });
});
