import '@testing-library/react/cleanup-after-each';
import '@testing-library/jest-dom/extend-expect';

// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
console.error = (err) => {
    throw new Error(err);
};
console.warn = (warning) => {
    throw new Error(warning);
};
