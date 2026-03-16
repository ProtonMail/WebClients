import { decodeUserData, encodeUserData, encodeUserDataLegacy } from './store.utils';

describe('`encodeUserData` / `decodeUserData`', () => {
    test('V2: round-trips email and display name', () => {
        const result = decodeUserData(encodeUserData('user@example.com', 'John Doe'));
        expect(result.PrimaryEmail).toBe('user@example.com');
        expect(result.DisplayName).toBe('John Doe');
    });

    test('V2: handles empty strings', () => {
        const result = decodeUserData(encodeUserData('', ''));
        expect(result.PrimaryEmail).toBe('');
        expect(result.DisplayName).toBe('');
    });

    test('V2: handles special characters', () => {
        const result = decodeUserData(encodeUserData('üser+tag@éxample.org', 'Ångström 日本語'));
        expect(result.PrimaryEmail).toBe('üser+tag@éxample.org');
        expect(result.DisplayName).toBe('Ångström 日本語');
    });

    test('V1 (backward compat): decodes legacy userData encoded with JSON.stringify + base64 strings', () => {
        const result = decodeUserData(encodeUserDataLegacy('legacy@example.com', 'Legacy User'));
        expect(result.PrimaryEmail).toBe('legacy@example.com');
        expect(result.DisplayName).toBe('Legacy User');
    });

    test('returns empty object on malformed input', () => {
        expect(decodeUserData('not-base64!!!')).toEqual({});
        expect(decodeUserData('')).toEqual({});
    });
});
