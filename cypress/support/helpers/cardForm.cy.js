function test(scope = 'card') {
    const DEFAULT_AMOUNT = [5, 10, 25, 50, 100, 250];

    const MAP_SELECTOR = {
        donation: '.donationForm-container',
        card: '.cardView-container'
    };

    const selector = (item) => cy.get(`${MAP_SELECTOR[scope]} ${item}`);
    const btnAmount = (amount = 25) => `.donationForm-btn-amount[data-amount="${amount}"]`;

    const setAmount = (value) => {
        if (DEFAULT_AMOUNT.includes(value) && scope === 'donation') {
            return cy.get(btnAmount(value)).click();
        }
        selector('#otherAmount').type(value);
    };

    const setCurrency = (value) => {
        selector('.donateModal-select-currency').select(value);
    };

    const choosePayment = (value) => {
        selector('#paymentMethod').select(value);
    };

    const setName = (value) => {
        selector('#fullname').type(value);
    };

    const setCard = ({
        number = 4242424242424242,
        month = '10',
        year = `${new Date().getUTCFullYear() + 1}`,
        cvc = '123'
    } = {}) => {
        selector('#cardnumber').type(number);
        selector('[ng-model="card.month"]').select(month);
        selector('[ng-model="card.year"]').select(year);
        selector('#cvc').type(cvc);
    };

    const setAddress = ({ zip = 38000, country = 'France' } = {}) => {
        selector('#zip').type(zip);
        cy.selectOption(country, '#country');
    };

    const getErrors = (item = 'fullname', strSelector) => {
        const key = strSelector || `[ng-messages="form.${item}.$error"]`;
        const find = (type) => selector(`${key} [ng-message="${type}"]`);
        const visibility = (test = true) => `${test ? '' : 'not.'}be.visible`.trim();
        const testable = (type) => (test) => find(type).should(visibility(test));

        const hasNumber = testable('number');
        const hasRequired = testable('required');
        const hasMax = testable('max');
        const hasMin = testable('min');
        const hasCardNumber = testable('cardNumber');
        const hasCvc = testable('cardCvc');

        return {
            hasNumber,
            hasRequired,
            hasMax,
            hasMin,
            hasCardNumber,
            hasCvc
        };
    };

    const defaultForm = () => {
        if (scope === 'donation') {
            const errorsAmount = getErrors('otherAmount', '.donateModal-choose-errors');
            errorsAmount.hasNumber(false);
            errorsAmount.hasMax(false);
            errorsAmount.hasMin(false);
        }

        setName('Thomas Anderson');
        getErrors().hasRequired(false);

        setCard();
        const errorsCard = getErrors('cardnumber');
        const errorsCvc = getErrors('cvc');
        errorsCard.hasRequired(false);
        errorsCard.hasCardNumber(false);
        errorsCvc.hasRequired(false);
        errorsCvc.hasCvc(false);

        setAddress();
        getErrors('zip').hasRequired(false);
    };

    return {
        defaultForm,
        setAmount,
        setCurrency,
        choosePayment,
        setName,
        setCard,
        setAddress,
        getErrors
    };
}

module.exports = test;
