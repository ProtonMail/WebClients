// An example configuration file.
exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub',

    // Capabilities to be passed to the webdriver instance.
    multiCapabilities: [
        // {browserName: 'firefox'},
        {browserName: 'chrome'}
    ],

    // The params object will be passed directly to the Protractor instance,
    // and can be accessed from your test as browser.params. It is an arbitrary
    // object and can contain anything you may need in your test.
    // This can be changed via the command line as:
    //   --params.login.user "Joe"
    params: {
        login: 'qatest1',
        password1: 'qatest1',
        password2: 'qatest1',
        sleep: 2000
    },

    baseUrl: 'http://localhost:8080',

    // Spec patterns are relative to the current working directly when
    // protractor is called.
    specs: [
        'test/e2e/login/login.spec.js',
        'test/e2e/unlock/unlock.spec.js',
        'test/e2e/contact/contact.spec.js'
    ],

    onPrepare: function() {

    },

    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};
