describe('Proton Mail App', function() {
    var ptor = protractor.getInstance();

    ptor.get('http://localhost:8080/login');

    beforeEach(function() {
        ptor.sleep(2000); // 2 sec
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
