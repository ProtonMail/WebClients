import * as useConfigModule from '@proton/components/hooks/useConfig';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';

export const mockUseConfig = (value?: Partial<ReturnType<typeof useConfigModule.default>>) => {
    const mockedUseConfig = jest.spyOn(useConfigModule, 'default');

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
        VERSION_PATH: '',
        ...value,
    });

    return mockedUseConfig;
};
