import '@testing-library/jest-dom';

import './jest.mock';

jest.mock('@proton/shared/lib/i18n/dateFnLocales', () => ({
    __esModule: true,
}));
