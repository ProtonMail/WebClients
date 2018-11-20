const main = require('../../fixtures/signup/main.spec');

main({
    key: 'plus_vpnplus:24:EUR',
    url: '/create/new?plan=plus_vpnplus&billing=24&currency=EUR',
    tests: {
        plans: ['ProtonMail Plus', 'ProtonVPN Plus'],
        billing: 'Every 2 years',
        price: '190.40 €',
        method: 'Credit card'
    }
});
