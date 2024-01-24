import humanSize from '@proton/shared/lib/helpers/humanSize';

describe('humanSize', () => {
    it('should 0 bytes correctly', () => {
        expect(humanSize({ bytes: 0 })).toEqual('0 bytes');
    });
    it('should 0 GB correctly', () => {
        expect(humanSize({ bytes: 0, unit: 'GB' })).toEqual('0.00 GB');
    });
    it('should 1.5 GB correctly', () => {
        expect(humanSize({ bytes: 1024 * 1024 * 1024 + 1024 * 1024 * 500, unit: 'GB', fraction: 0 })).toEqual('1.5 GB');
    });
    it('should 1.5 GB correctly', () => {
        expect(
            humanSize({
                bytes: 1024 * 1024 * 1024 + 1024 * 1024 * 500,
                truncate: true,
                unit: 'GB',
                fraction: 0,
            })
        ).toEqual('1 GB');
    });
    it('should 1 GB correctly', () => {
        expect(humanSize({ bytes: 1024 * 1024 * 1024, unit: 'GB', fraction: 0 })).toEqual('1 GB');
    });
    it('should 1.0 GB correctly', () => {
        expect(humanSize({ bytes: 1024 * 1024 * 1024, unit: 'GB', fraction: 1 })).toEqual('1.0 GB');
    });
});
