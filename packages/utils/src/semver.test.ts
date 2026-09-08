import { semver } from './semver';

describe('semver', () => {
    test('should parse `major` format', () => {
        expect(semver('1')).toEqual(1000000000);
        expect(semver('2')).toEqual(2000000000);
        expect(semver('22')).toEqual(22000000000);
        expect(semver('9999')).toEqual(9999000000000);
    });

    test('should parse `major.minor` format', () => {
        expect(semver('1.0')).toEqual(1000000000);
        expect(semver('1.1')).toEqual(1001000000);
        expect(semver('1.1')).toEqual(1001000000);
        expect(semver('2.2')).toEqual(2002000000);
        expect(semver('22.0')).toEqual(22000000000);
        expect(semver('9999.0')).toEqual(9999000000000);
    });

    test('should parse `major.minor.patch` format', () => {
        expect(semver('1.0.0')).toEqual(1000000000);
        expect(semver('1.1.0')).toEqual(1001000000);
        expect(semver('1.1.1')).toEqual(1001001000);
        expect(semver('2.2.2')).toEqual(2002002000);
        expect(semver('22.0.0')).toEqual(22000000000);
        expect(semver('9999.0.1')).toEqual(9999000001000);
    });

    test('should parse `major.minor.patch.build` format', () => {
        expect(semver('1.0.0.0')).toEqual(1000000000);
        expect(semver('1.1.0.1')).toEqual(1001000001);
        expect(semver('1.1.1.2')).toEqual(1001001002);
        expect(semver('2.2.2.99')).toEqual(2002002099);
        expect(semver('22.0.0.9')).toEqual(22000000009);
        expect(semver('9999.0.1.999')).toEqual(9999000001999);
    });

    test('should parse `major.minor.patch-rc` format', () => {
        expect(semver('1.0.0-rc1')).toEqual(1000000000);
        expect(semver('1.1.0-beta')).toEqual(1001000000);
        expect(semver('11.1.100-rc2')).toEqual(11001100000);
    });

    test('comparing should work', () => {
        expect(semver('1.0.0') > semver('0.0.2')).toBe(true);
        expect(semver('1.0.0') < semver('1.0.1')).toBe(true);
        expect(semver('1.0.0.1') > semver('1.0.0')).toBe(true);
        expect(semver('1.0.0') === semver('1.0.0')).toBe(true);
        expect(semver('1.0.0-rc3') === semver('1.0.0')).toBe(true);
        expect(semver('1.0.0-rc3') < semver('1.0.0.1')).toBe(true);
        expect(semver('1.2.3') > semver('1.2.2')).toBe(true);
        expect(semver('1.2.3.4') > semver('1.2.3')).toBe(true);
        expect(semver('1.2.3.999') > semver('1.2.3')).toBe(true);
        expect(semver('999.2.3.999') > semver('1.2.3')).toBe(true);
    });

    test('should handle invalid input', () => {
        expect(semver('invalid')).toBe(0);
        expect(semver('1.2.invalid')).toBe(1002000000);
    });
});
