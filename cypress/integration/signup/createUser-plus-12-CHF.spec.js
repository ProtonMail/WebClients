const main = require('../../fixtures/signup/main.spec');

main({
    key: 'plus:12:CHF',
    url: '/create/new?plan=plus&billing=12&currency=EUR',
    tests: {
        plans: ['ProtonMail Plus'],
        billing: 'Annually',
        price: '48.00 CHF',
        method: 'Credit card'
    }
});
