import '@testing-library/jest-dom/extend-expect';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// These modules uses require.context which is a Webpack feature which can't work in Jest
jest.mock('proton-shared/lib/i18n/dateFnLocales.js', () => ({}));
jest.mock('react-components/containers/payments/CardNumberInput.js', () => ({}));
jest.mock('react-components/containers/paymentMethods/PaymentMethodDetails.js', () => ({}));
jest.mock('react-components/containers/vpn/OpenVPNConfigurationSection/Country.js', () => ({}));

// Globally mocked react-components modules
jest.mock('react-components/containers/eventManager/useEventManager.js', () => () => {
    return {
        subscribe: jest.fn(),
        call: jest.fn()
    };
});

// Globally mocked upload helper (standard requests are mocked through context)
jest.mock('./src/app/helpers/upload');
