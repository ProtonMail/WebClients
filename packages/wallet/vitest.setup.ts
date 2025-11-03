import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

import '@proton/testing/lib/vitest/mockMatchMedia';
import '@proton/testing/lib/vitest/mockUnleash';

afterEach(cleanup); // TODO double check if needed; see https://github.com/vitest-dev/vitest/issues/1430
// Silence warnings on expect to throw https://github.com/testing-library/react-testing-library/issues/157
// console.error = () => {};
// console.warn = () => {};

vi.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
    enUSLocale: undefined,
}));
