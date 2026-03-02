import { MemberRole } from '@proton/drive';

import { shouldRedirectToPrivateApp } from './shouldRedirectToPrivateApp';

describe('shouldRedirectToPrivateApp', () => {
    it('returns false when directRole is undefined', () => {
        expect(shouldRedirectToPrivateApp(undefined, MemberRole.Viewer)).toBe(false);
        expect(shouldRedirectToPrivateApp(undefined, MemberRole.Editor)).toBe(false);
        expect(shouldRedirectToPrivateApp(undefined, undefined)).toBe(false);
    });

    it('returns true when directRole equals publicRole', () => {
        expect(shouldRedirectToPrivateApp(MemberRole.Viewer, MemberRole.Viewer)).toBe(true);
        expect(shouldRedirectToPrivateApp(MemberRole.Editor, MemberRole.Editor)).toBe(true);
        expect(shouldRedirectToPrivateApp(MemberRole.Admin, MemberRole.Admin)).toBe(true);
    });

    it('returns true when directRole is higher than publicRole', () => {
        expect(shouldRedirectToPrivateApp(MemberRole.Editor, MemberRole.Viewer)).toBe(true);
        expect(shouldRedirectToPrivateApp(MemberRole.Admin, MemberRole.Viewer)).toBe(true);
        expect(shouldRedirectToPrivateApp(MemberRole.Admin, MemberRole.Editor)).toBe(true);
    });

    it('returns false when publicRole is higher than directRole', () => {
        expect(shouldRedirectToPrivateApp(MemberRole.Viewer, MemberRole.Editor)).toBe(false);
        expect(shouldRedirectToPrivateApp(MemberRole.Viewer, MemberRole.Admin)).toBe(false);
        expect(shouldRedirectToPrivateApp(MemberRole.Editor, MemberRole.Admin)).toBe(false);
    });

    it('returns true when directRole is set and publicRole is undefined', () => {
        expect(shouldRedirectToPrivateApp(MemberRole.Viewer, undefined)).toBe(true);
        expect(shouldRedirectToPrivateApp(MemberRole.Editor, undefined)).toBe(true);
    });
});
