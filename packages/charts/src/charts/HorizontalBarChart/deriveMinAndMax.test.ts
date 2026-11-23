import { EMPTY_RANGE_MAX } from './constants';
import { deriveMinAndMax } from './deriveMinAndMax';

const data = [
    { label: 'DEV-VPN', value: 782 },
    { label: 'INFRA-VPN', value: 279 },
];

describe('deriveMinAndMax', () => {
    it('takes the caller at their word, even where the data overflows it', () => {
        expect(deriveMinAndMax(data, { min: 10, max: 100 })).toEqual({
            min: 10,
            max: 100,
        });
    });

    it('runs between the readings it was given, rather than from a floor nobody asked for', () => {
        expect(deriveMinAndMax(data, undefined)).toEqual({
            min: 279,
            max: 782,
        });
    });

    it('spans readings that are close together, where a floor at zero would flatten them', () => {
        expect(
            deriveMinAndMax([
                { label: 'Week 1', value: 22_000_000 },
                { label: 'Week 2', value: 22_000_900 },
            ])
        ).toEqual({ min: 22_000_000, max: 22_000_900 });
    });

    it('follows readings below zero', () => {
        expect(deriveMinAndMax([{ label: 'DEV-VPN', value: -40 }, ...data], undefined)).toEqual({
            min: -40,
            max: 782,
        });
    });

    it('measures readings that are all the same against zero, so they are drawn at all', () => {
        expect(
            deriveMinAndMax([
                { label: 'A', value: 500 },
                { label: 'B', value: 500 },
            ])
        ).toEqual({
            min: 0,
            max: 500,
        });
        expect(deriveMinAndMax([{ label: 'A', value: -8 }], undefined)).toEqual({ min: -8, max: 0 });
    });

    it('keeps a span wide enough to paint where nothing in the data can give one', () => {
        expect(deriveMinAndMax([], undefined)).toEqual({
            min: 0,
            max: EMPTY_RANGE_MAX,
        });
        expect(deriveMinAndMax([{ label: 'DEV-VPN', value: 0 }], undefined)).toEqual({
            min: 0,
            max: EMPTY_RANGE_MAX,
        });
    });
});
