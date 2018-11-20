const main = require('../../fixtures/signup/main.spec');

main({
    key: 'visionary:1:USD',
    url: '/create/new?plan=visionary&billing=1&currency=USD',
    tests: {
        plans: ['Visionary'],
        billing: 'Monthly',
        price: '$30',
        method: 'Credit card'
    }
});
