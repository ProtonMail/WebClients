import { deriveAliasPrefix } from './alias';

describe('alias utils', () => {
    describe('deriveAliasPrefix', () => {
        test('should return string if passes checks', () => {
            expect(deriveAliasPrefix('prefix.com')).toEqual('prefix.com');
            expect(deriveAliasPrefix('sub.prefix.com')).toEqual('sub.prefix.com');
            expect(deriveAliasPrefix('prefix')).toEqual('prefix');
            expect(deriveAliasPrefix('')).toEqual('');
        });

        test('should trim to 20 characters', () => {
            const base = 'twenty.characterlong';
            expect(deriveAliasPrefix(base)).toEqual(base);
            expect(deriveAliasPrefix(base.concat('1'))).toEqual(base);
            expect(deriveAliasPrefix(base.concat(base))).toEqual(base);
        });

        test('should remove & sanitize unsupported special characters', () => {
            expect(deriveAliasPrefix('valid-special_chars')).toEqual('valid-special_chars');
            expect(deriveAliasPrefix('invalid$$!!```')).toEqual('invalid');
            expect(deriveAliasPrefix('éééàààéééàéàéàé')).toEqual('eeeaaaeeeaeaeae');
            expect(deriveAliasPrefix('😅-foo-😀')).toEqual('-foo-');
        });

        test('should remove trailing dot if any', () => {
            expect(deriveAliasPrefix('trailing.')).toEqual('trailing');
            expect(deriveAliasPrefix('trailing..')).toEqual('trailing');
            expect(deriveAliasPrefix('trailing...')).toEqual('trailing');
        });
    });
});
