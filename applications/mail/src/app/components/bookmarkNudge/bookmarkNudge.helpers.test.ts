import type * as BrowserHelpers from '@proton/shared/lib/helpers/browser';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type * as DesktopHelpers from '@proton/shared/lib/helpers/desktop';

import { BOOKMARK_NUDGE_START_DATE, getIsUserEligible } from './bookmarkNudge.helpers';

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => {
    const actual = await importOriginal<typeof BrowserHelpers>();
    return { ...actual, isMobile: vi.fn(() => false) };
});

const desktopMock = vi.hoisted(() => ({ isElectronApp: false }));
vi.mock('@proton/shared/lib/helpers/desktop', async (importOriginal) => {
    const actual = await importOriginal<typeof DesktopHelpers>();
    return {
        ...actual,
        get isElectronApp() {
            return desktopMock.isElectronApp;
        },
    };
});

const startTime = BOOKMARK_NUDGE_START_DATE.getTime() / 1000;
const DAY = 24 * 60 * 60;
const newUser = { CreateTime: startTime + DAY };

describe('getIsUserEligible', () => {
    beforeEach(() => {
        vi.mocked(isMobile).mockReturnValue(false);
        desktopMock.isElectronApp = false;
    });

    it('is eligible for a new desktop user who finished the welcome onboarding', () => {
        expect(getIsUserEligible(newUser, true)).toBe(true);
    });

    it('is eligible for an account created on the start date', () => {
        expect(getIsUserEligible({ CreateTime: startTime }, true)).toBe(true);
    });

    it('is not eligible for an account created before the start date', () => {
        expect(getIsUserEligible({ CreateTime: startTime - 1 }, true)).toBe(false);
    });

    it('is not eligible during the welcome onboarding', () => {
        expect(getIsUserEligible(newUser, false)).toBe(false);
    });

    it('is not eligible on mobile web', () => {
        vi.mocked(isMobile).mockReturnValue(true);
        expect(getIsUserEligible(newUser, true)).toBe(false);
    });

    it('is not eligible in the desktop app', () => {
        desktopMock.isElectronApp = true;
        expect(getIsUserEligible(newUser, true)).toBe(false);
    });
});
