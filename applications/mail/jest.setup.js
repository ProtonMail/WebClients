import '@testing-library/jest-dom/extend-expect';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

// These modules uses require.context which is a Webpack feature which can't work in Jest
jest.mock('proton-shared/lib/i18n/dateFnLocales.js', () => ({}));
jest.mock('react-components/containers/payments/CardNumberInput.js', () => ({}));
jest.mock('react-components/containers/vpn/OpenVPNConfigurationSection/Country.js', () => ({}));

// Globally mocked react-components modules
jest.mock('react-components/containers/eventManager/useEventManager.js', () => () => {
    return {
        subscribe: jest.fn()
    };
});

// Prevent to load OpenPGP which doesn't work anyway (because of asm.js)
jest.mock('proton-shared/lib/helpers/setupPmcrypto.js', () => {
    return {
        initMain: jest.fn(),
        initWorker: jest.fn()
    };
});
