import getDefaultLabel from './useStepPrepareImap.helpers';

const defaultDate = '01-01-2025 00:00';

jest.mock('date-fns', () => {
    const originalModule = jest.requireActual('date-fns');
    return {
        ...originalModule,
        format: jest.fn().mockReturnValue('01-01-2025 00:00'),
    };
});

describe('getDefaultLabel', () => {
    it('should return the correct domain name when present (pm.me)', () => {
        const result = getDefaultLabel('hello@pm.me');
        expect(result.Name).toBe(`pm.me ${defaultDate}`);
    });

    it('should return the correct domain name when present (gmail.com)', () => {
        const result = getDefaultLabel('hello@gmail.com');
        expect(result.Name).toBe(`gmail.com ${defaultDate}`);
    });

    it('should return the default label when not an email', () => {
        const result = getDefaultLabel('no an email');
        expect(result.Name).toBe(`Easy Switch ${defaultDate}`);
    });
});
