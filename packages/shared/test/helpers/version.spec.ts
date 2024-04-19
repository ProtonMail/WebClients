import { Version } from '@proton/shared/lib/helpers/version';

describe('Version', () => {
    it('isEqualTo', () => {
        const version = new Version('1.2.3');
        expect(version.isEqualTo('1.2.3')).toEqual(true);
        expect(version.isEqualTo('1.2.3.0')).toEqual(true);
        expect(version.isEqualTo('0.1.2.3')).toEqual(false);
        expect(version.isEqualTo('1.2')).toEqual(false);
    });
    it('isGreaterThan', () => {
        const version = new Version('1.2.3');
        expect(version.isGreaterThan('1.2.3')).toEqual(false);
        expect(version.isGreaterThan('1.2.1')).toEqual(true);
        expect(version.isGreaterThan('1.2')).toEqual(true);
        expect(version.isGreaterThan('1.2.3.1')).toEqual(false);
        expect(version.isGreaterThan('1.2.4')).toEqual(false);
    });
    it('isSmallerThan', () => {
        const version = new Version('1.2.3');
        expect(version.isSmallerThan('1.2.3')).toEqual(false);
        expect(version.isSmallerThan('1.2.1')).toEqual(false);
        expect(version.isSmallerThan('1.2.4')).toEqual(true);
        expect(version.isSmallerThan('1.2')).toEqual(false);
        expect(version.isSmallerThan('1.3')).toEqual(true);
        expect(version.isSmallerThan('1.2.4')).toEqual(true);
    });
    it('isGreaterThanOrEqual', () => {
        const version = new Version('1.2.3');
        expect(version.isGreaterThanOrEqual('1.2.3')).toEqual(true);
        expect(version.isGreaterThanOrEqual('1.2.4')).toEqual(false);
        expect(version.isGreaterThanOrEqual('1.2.3.0')).toEqual(true);
        expect(version.isGreaterThanOrEqual('1.2.3.1')).toEqual(false);
    });
    it('isSmallerThanOrEqual', () => {
        const version = new Version('1.2.3');
        expect(version.isSmallerThanOrEqual('1.2.3')).toEqual(true);
        expect(version.isSmallerThanOrEqual('1.2.4')).toEqual(true);
        expect(version.isSmallerThanOrEqual('1.2.3.0')).toEqual(true);
        expect(version.isSmallerThanOrEqual('1.2.3.1')).toEqual(true);
    });
});
