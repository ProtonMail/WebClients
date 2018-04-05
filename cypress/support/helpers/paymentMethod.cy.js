const MAIN_SELECTOR = '#paymentMethod';
const MAP_SELECTOR = {
    cash: {
        label: 'Cash'
    },
    card: {
        label: 'Credit Card',
        selector: '.cardView-container'
    },
    paypal: {
        label: 'PayPal',
        selector: '.paypal-container'
    },
    bitcoin: {
        label: 'Bitcoin',
        selector: '.bitcoinView-container'
    }
};

const getInfo = (value, number) => {
    if (number) {
        return {
            label: `•••• •••• •••• ${number}`
        };
    }
    return MAP_SELECTOR[value];
};

const isVisible = (value, number) => {
    const list = Object.keys(MAP_SELECTOR)
        .filter((key) => key !== value)
        .map(({ selector }) => selector)
        .filter(Boolean);

    number && list.push(MAP_SELECTOR[value].selector);

    list.forEach((selector) => {
        cy.get(selector).should('not.exist');
    });
};

const select = (value, number) => {
    const { label, selector } = getInfo(value, number);
    cy.get(MAIN_SELECTOR).select(label);
    selector && cy.get(selector).should('exist');
    isVisible(value, number);
};

module.exports = select;
