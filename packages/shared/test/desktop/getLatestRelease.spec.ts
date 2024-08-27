import { RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { type DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';

import { getLatestRelease } from '../../lib/desktop/getLatestRelease';

describe('getLatestRelease', () => {
    describe('when alpha is the latest', () => {
        const releaseList = [
            { Version: '1.2.0', CategoryName: RELEASE_CATEGORIES.ALPHA },
            { Version: '1.1.0', CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS },
            { Version: '1.0.0', CategoryName: RELEASE_CATEGORIES.STABLE },
            { Version: '0.9.0', CategoryName: RELEASE_CATEGORIES.STABLE },
            { Version: '0.0.1', CategoryName: RELEASE_CATEGORIES.STABLE },
        ] as DesktopVersion[];

        it('should get alpha release, when local is alpha', () => {
            expect(getLatestRelease('alpha', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.ALPHA })
            );
        });
        it('should get beta release, when local is beta', () => {
            expect(getLatestRelease('beta', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS })
            );
        });
        it('should get stable release, when local is default', () => {
            expect(getLatestRelease('default', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
        it('should get stable release, when local is undefined', () => {
            expect(getLatestRelease(undefined, releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
    });

    describe('when beta is the latest', () => {
        const releaseList = [
            { Version: '1.1.0', CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS },
            { Version: '1.0.0', CategoryName: RELEASE_CATEGORIES.STABLE },
            { Version: '0.9.0', CategoryName: RELEASE_CATEGORIES.STABLE },
            { Version: '0.0.1', CategoryName: RELEASE_CATEGORIES.STABLE },
        ] as DesktopVersion[];

        it('should get beta release, when local is alpha', () => {
            expect(getLatestRelease('alpha', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS })
            );
        });
        it('should get beta release, when local is beta', () => {
            expect(getLatestRelease('beta', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.EARLY_ACCESS })
            );
        });
        it('should get stable release, when local is default', () => {
            expect(getLatestRelease('default', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
        it('should get stable release, when local is undefined', () => {
            expect(getLatestRelease(undefined, releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
    });

    describe('when stable is the latest', () => {
        const releaseList = [
            { Version: '0.9.0', CategoryName: RELEASE_CATEGORIES.STABLE },
            { Version: '0.0.1', CategoryName: RELEASE_CATEGORIES.STABLE },
            { Version: '1.0.0', CategoryName: RELEASE_CATEGORIES.STABLE },
        ] as DesktopVersion[];

        it('should get stable release, when local is alpha', () => {
            expect(getLatestRelease('alpha', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
        it('should get stable release, when local is beta', () => {
            expect(getLatestRelease('beta', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
        it('should get stable release, when local is default', () => {
            expect(getLatestRelease('default', releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });
        it('should get stable release, when local is undefined', () => {
            expect(getLatestRelease(undefined, releaseList)).toEqual(
                jasmine.objectContaining({ CategoryName: RELEASE_CATEGORIES.STABLE })
            );
        });

        it('should get highest version', () => {
            expect(getLatestRelease('default', releaseList)).toEqual(jasmine.objectContaining({ Version: '1.0.0' }));
        });
    });
});
