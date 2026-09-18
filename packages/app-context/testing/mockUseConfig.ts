// Package import so jest.spyOn matches modules resolved through @proton/app-context in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, import/no-extraneous-dependencies -- jest module identity
import * as useConfigModule from '@proton/app-context/useConfig';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';

jest.mock('@proton/app-context/useConfig', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/app-context/useConfig'),
}));

export const mockUseConfig = (value?: Partial<ReturnType<typeof useConfigModule.useConfig>>) => {
    const mockedUseConfig = jest.spyOn(useConfigModule, 'useConfig');

    mockedUseConfig.mockReturnValue({
        CLIENT_TYPE: CLIENT_TYPES.MAIL,
        CLIENT_SECRET: '',
        APP_VERSION: '0.0.1',
        APP_NAME: APPS.PROTONMAIL,
        API_URL: 'string',
        LOCALES: {},
        DATE_VERSION: '',
        COMMIT: '',
        BRANCH: 'main',
        SENTRY_DSN: '',
        SSO_URL: '',
        VERSION_PATH: '',
        LOGICAL_SCSS: true,
        ...value,
    });

    return mockedUseConfig;
};
