import { getIsSectionAvailable, getIsSubsectionAvailable } from './helper';
import type { SectionConfig, SubSectionConfig } from './interface';

describe('getIsSubsectionAvailable', () => {
    it('returns true when `available` is undefined', () => {
        const config: SubSectionConfig = {
            id: '',
        };

        const result = getIsSubsectionAvailable(config);

        expect(result).toBe(true);
    });

    it('returns true when `available` is true', () => {
        const config: SubSectionConfig = {
            id: '',
            available: true,
        };

        const result = getIsSubsectionAvailable(config);

        expect(result).toBe(true);
    });

    it('returns false when `available` is false', () => {
        const config: SubSectionConfig = {
            id: '',
            available: false,
        };

        const result = getIsSubsectionAvailable(config);

        expect(result).toBe(false);
    });
});

describe('getIsSectionAvailable', () => {
    describe('available property', () => {
        it('returns true when `available` is undefined', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                subsections: [{ id: '' }],
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(true);
        });

        it('returns true when `available` is true', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                available: true,
                subsections: [{ id: '' }],
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(true);
        });

        it('returns false when `available` is false', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                available: false,
                subsections: [{ id: '' }],
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(false);
        });
    });

    describe('subsections prop', () => {
        it('returns true when `subsections` is undefined', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                available: true,
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(true);
        });

        it('returns true when all `subsections` are available', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                available: true,
                subsections: [
                    { id: '1', available: true },
                    { id: '2', available: true },
                ],
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(true);
        });

        it('returns true when some `subsections` are available', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                available: true,
                subsections: [
                    { id: '1', available: false },
                    { id: '2', available: true },
                ],
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(true);
        });

        it('returns false when no `subsections` are available', () => {
            const config: SectionConfig = {
                to: '',
                icon: 'alias',
                text: '',
                available: true,
                subsections: [
                    { id: '1', available: false },
                    { id: '2', available: false },
                ],
            };

            const result = getIsSectionAvailable(config);

            expect(result).toBe(false);
        });
    });
});
