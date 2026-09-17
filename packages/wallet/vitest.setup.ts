import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

import '@proton/components/testing/vitest/mockMatchMedia';
import '@proton/polyfill';
import '@proton/unleash/testing/vitest/mockUnleash';

afterEach(cleanup); // TODO double check if needed; see https://github.com/vitest-dev/vitest/issues/1430
// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};
