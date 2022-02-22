import '@testing-library/jest-dom';
import './jest.mock';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
console.error = () => {};
console.warn = () => {};
