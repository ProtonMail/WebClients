module.exports = {
    Subject(type) {
        return `[${type}] E2E: Ha que coucou`;
    },
    email(username = Cypress.env('login1')) {
        return `${username}@protonmail.blue`;
    },
    ToList: `${Cypress.env('login1')}@protonmail.com`,
    CCList: `${Cypress.env('login1')}+roberto@protonmail.com`,
    BCCList: `${Cypress.env('login1')}+monique@protonmail.com`,
    body:
        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dignissimos aperiam debitis, ipsam numquam eius unde cupiditate atque enim, deleniti amet, quidem itaque. Voluptatum quisquam voluptates neque, numquam molestiae! Molestiae, aliquam?',
    linkImage: 'https://i.imgur.com/WScAnHr.jpg',
    linkLabel: 'Hey monique !',
    expiration: {
        hours: 5,
        days: 3,
        weeks: 1
    }
};
