import { AuthServiceContext } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { PrivateApp } from 'proton-pass-web/app/Views/PrivateApp';

import type { AuthService } from '@proton/pass/lib/auth/service';
import { TEST_LOCAL_ID } from '@proton/pass/utils/tests/app';
import type { TestRenderOptions } from '@proton/pass/utils/tests/render';
import { render } from '@proton/pass/utils/tests/render';
import { getLocalIDPath } from '@proton/shared/lib/authentication/pathnameHelper';

const createTestAuthService = () =>
    ({
        checkLock: jest.fn().mockResolvedValue(undefined),
        lock: jest.fn(),
        logout: jest.fn(),
        requestFork: jest.fn(),
    }) as unknown as AuthService;

export const renderPrivateApp = ({ core, ...options }: TestRenderOptions = {}) => {
    const auth = createTestAuthService();
    const writeToClipboard = jest.fn().mockResolvedValue(true);

    const result = render(
        <AuthServiceContext.Provider value={auth}>
            <PrivateApp />
        </AuthServiceContext.Provider>,
        { route: `/${getLocalIDPath(TEST_LOCAL_ID)}`, core: { writeToClipboard, ...core }, ...options }
    );

    return { ...result, auth, writeToClipboard };
};
