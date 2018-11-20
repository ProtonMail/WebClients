const main = require('../../fixtures/signup/main.spec');

main({
    key: 'plus_vpnplus:24:EUR:coupon',
    url: '/create/new?plan=plus_vpnplus&billing=24&currency=EUR&coupon=TWO4ONE2018',
    tests: {
        plans: ['ProtonMail Plus', 'ProtonVPN Plus'],
        billing: 'Every 2 years',
        price: '144.00 €',
        method: 'Credit card',
        coupon: 'TWO4ONE2018'
    }
});
