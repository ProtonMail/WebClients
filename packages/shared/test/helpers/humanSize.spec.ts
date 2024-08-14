import humanSize, { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';

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

    it('should show max correctly', () => {
        (
            [
                { max: 'B', expectation: '1099511627776 bytes' },
                { max: 'KB', expectation: '1073741824 KB' },
                { max: 'MB', expectation: '1048576 MB' },
                { max: 'GB', expectation: '1024 GB' },
                { max: 'TB', expectation: '1 TB' },
            ] as const
        ).forEach(({ max, expectation }) => {
            expect(
                humanSize({
                    bytes: 1024 * 1024 * 1024 * 1024,
                    unitOptions: { max },
                    fraction: 0,
                })
            ).toEqual(expectation);
        });
    });
});

describe('shortHumanSize', () => {
    it('should show 0 bytes correctly', () => {
        expect(shortHumanSize(0)).toEqual('0 bytes');
    });
    it('should show 10 bytes correctly', () => {
        expect(shortHumanSize(10)).toEqual('10 bytes');
    });
    it('should show 10 KB correctly', () => {
        expect(shortHumanSize(1024 * 10)).toEqual('10 KB');
    });
    it('should show 10.5 KB correctly', () => {
        expect(shortHumanSize(1024 * 10)).toEqual('10 KB');
    });
    it('should show 10 MB correctly', () => {
        expect(shortHumanSize(1024 * 1024 * 10)).toEqual('10 MB');
    });
    it('should show 10.5 MB correctly', () => {
        expect(shortHumanSize(1024 * 1024 * 10 + 1024 * 500)).toEqual('10 MB');
    });
    it('should show 1.5 GB correctly', () => {
        expect(shortHumanSize(1024 * 1024 * 1024 + 1024 * 1024 * 500)).toEqual('1.5 GB');
    });
    it('should show 1 GB correctly', () => {
        expect(shortHumanSize(1024 * 1024 * 1024)).toEqual('1.0 GB');
    });
});
