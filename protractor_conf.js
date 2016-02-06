// An example configuration file.
exports.config = {
    seleniumAddress: 'http://localhost:4444/wd/hub', // Where to talk to the Selenium Server instance that is running on your machine. This can be verified by checking the logs in the terminal window that is running the server.
    getPageTimeout: 60000, // Time to wait for the page to load
    allScriptsTimeout: 500000, // Time to wait for page to synchronize. More information on timeouts can be found in Protractor’s
    baseUrl: 'http://localhost:8080', // Main URL to hit for testing. This is helpful if there is only one, root URL.
    framework: 'jasmine', // Where you specify the type of framework to use with Protractor

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

    // Spec patterns are relative to the current working directly when
    // protractor is called.
    specs: ['test/e2e/**/*.spec.js'],

    // Alternatively, suites may be used. When run without a command line
    // parameter, all suites will run. If run with --suite=smoke or
    // --suite=smoke,full only the patterns matched by the specified suites will
    // run.
    suites: {
        login: 'test/e2e/login/login.spec.js',
        unlock: 'test/e2e/unlock/unlock.spec.js',
        contact: 'test/e2e/contact/contact.spec.js',
        dashboard: 'test/e2e/dashboard/dashboard.spec.js',
    }
};
