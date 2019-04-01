import _ from 'lodash';

import { DEFAULT_CURRENCY, CURRENCIES } from '../../constants';

/* @ngInject */
function donation(cardModel, gettextCatalog, dispatchers, paymentUtils, donateModel, authentication) {
    const SELECTOR = {
        BTN_AMOUNT: 'donationForm-btn-amount',
        BTN_SUBMIT: 'donationForm-btn-submit',
        INPUT_OTHER: '[id="otherAmount"]',
        SELECT_CURRENCY: '.donateModal-choose-currency',
        SELECT_METHOD: '[id="paymentMethod"]'
    };

    donateModel.init();
    const currencies = CURRENCIES.map((value) => ({ label: value, value }));

    const getParameters = (scope) => (paypalConfig = {}) => {
        const Amount = (scope.model.otherAmount || scope.model.amount) * 100;
        const Currency = scope.model.currency.value;
        // The buy credit route use `Credit` and the donate route use `Donation`
        const parameters = { Amount, Credit: Amount, Donation: Amount, Currency };

        if (scope.model.method.value === 'use.card') {
            parameters.PaymentMethodID = scope.model.method.ID;
        }

        if (scope.model.method.value === 'card') {
            parameters.Payment = {
                Type: 'card',
                Details: cardModel(scope.model.card).details()
            };
        }

        if (scope.model.method.value === 'paypal') {
            parameters.Payment = {
                Type: 'paypal',
                Details: paypalConfig
            };
        }

        return parameters;
    };

    return {
        replace: true,
        scope: {
            processing: '=?',
            method: '=?',
            type: '@'
        },
        templateUrl: require('../../../templates/payment/donation.tpl.html'),
        link(scope, el, { action = '' }) {
            const { on, unsubscribe, dispatcher } = dispatchers(['payments']);
            const dispatch = (type, data = {}) => dispatcher.payments(type, data);
            const loadDonation = (type, action) => (options) => dispatch('donate.submit', { type, options, action });

            const $items = el.find(SELECTOR.SELECT_CURRENCY);
            const $other = el.find(SELECTOR.INPUT_OTHER);
            const $methods = el.find(SELECTOR.SELECT_METHOD);
            const { list, selected } = paymentUtils.generateMethods();
            const buildRequestOption = getParameters(scope);
            const donate = loadDonation(scope.type, action);

            scope.model = {
                card: {},
                method: selected,
                amount: 25,
                currency: _.find(currencies, { value: authentication.user.Currency || DEFAULT_CURRENCY })
            };

            scope.currencies = currencies;
            scope.methods = list;

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
                scope.donationForm.$valid && donate(buildRequestOption());
            };

            /**
             * Refresh component such as paypal/bitcoin
             */
            const changeValue = () => {
                const ghost = scope.model.method.value;

                if (ghost === 'paypal' || ghost === 'bitcoin') {
                    scope.model.method.value = '';
                    _rAF(() => {
                        scope.$applyAsync(() => (scope.model.method.value = ghost));
                    });
                }
            };

            scope.getAmount = () => (scope.model.otherAmount || scope.model.amount || 0) * 100;
            scope.onFocusOtherAmount = () => (scope.model.amount = null);
            scope.paypalCallback = (config) => donate(buildRequestOption(config));

            const onClick = ({ target }) => {
                if (target.classList.contains(SELECTOR.BTN_AMOUNT)) {
                    const value = +target.dataset.amount;
                    scope.$applyAsync(() => {
                        scope.model.otherAmount = null;
                        scope.model.amount = value;
                        changeValue();
                    });
                }
            };

            const onInput = () => scope.$applyAsync(changeValue);
            const onChange = () => scope.$applyAsync(changeValue);
            const onChangeMethod = () => scope.$applyAsync(() => (scope.method = scope.model.method));

            el.on('click', onClick);
            el.on('submit', onSubmit);
            $items.on('change', onChange);
            $methods.on('change', onChangeMethod);
            $other.on('input', onInput);

            on('payments', (e, { type }) => {
                if (/^(donation|topUp)\.request\.load/.test(type)) {
                    scope.$applyAsync(() => (scope.processing = true));
                }

                if (/^(donation|topUp)\.request\.(success|error)/.test(type)) {
                    scope.$applyAsync(() => (scope.processing = false));
                }

                if (type === 'donation.input.submit') {
                    _rAF(() => el.triggerHandler('submit'));
                }
            });

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                el.off('submit', onSubmit);
                $items.off('change', onChange);
                $methods.off('change', onChangeMethod);
                $other.off('input', onInput);
                unsubscribe();
            });
        }
    };
}
export default donation;
