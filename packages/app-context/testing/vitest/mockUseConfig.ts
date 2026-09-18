import { vi } from 'vitest';

// Package import so vi.spyOn matches modules resolved through @proton/app-context in consumers.
// eslint-disable-next-line custom-rules/no-package-self-import, import/no-extraneous-dependencies -- vitest module identity
import * as useConfigModule from '@proton/app-context/useConfig';
import { APPS, CLIENT_TYPES } from '@proton/shared/lib/constants';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export const mockUseConfig = (value?: Partial<ProtonConfig>) => {
    const spy = vi.spyOn(useConfigModule, 'useConfig');
    spy.mockReturnValue({
        CLIENT_TYPE: CLIENT_TYPES.MAIL,
        CLIENT_SECRET: 'string',
        APP_VERSION: '0.0.999999',
        APP_NAME: APPS.PROTONMAIL,
        API_URL: '',
        LOCALES: {},
        DATE_VERSION: '',
        COMMIT: '',
        BRANCH: '',
        SENTRY_DSN: '',
        SSO_URL: '',
        VERSION_PATH: '',
        LOGICAL_SCSS: false,
        ...value,
    });
    return spy;
};
