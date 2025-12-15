import { ApiRateLimiter } from '../../lib/api/apiRateLimiter';

describe('ApiRateLimiter', () => {
    it('should be disabled by default', () => {
        const rateLimiter = new ApiRateLimiter();
        expect(rateLimiter.isEnabled()).toBe(false);
    });

    describe('when disabled', () => {
        it('should not recordCallOrThrow', () => {
            const rateLimiter = new ApiRateLimiter();
            rateLimiter.recordCallOrThrow('https://api.example.com/test');
            expect(rateLimiter.getCallCount('https://api.example.com/test')).toBe(0);
        });
    });

    describe('when enabled', () => {
        it('should record calls for different URLs', () => {
            const rateLimiter = new ApiRateLimiter();
            rateLimiter.enable();
            rateLimiter.recordCallOrThrow('https://api.example.com/test');
            rateLimiter.recordCallOrThrow('https://api.example.com/test2');
            rateLimiter.recordCallOrThrow('https://api.example.com/test2');
            expect(rateLimiter.getCallCount('https://api.example.com/test')).toBe(1);
            expect(rateLimiter.getCallCount('https://api.example.com/test2')).toBe(2);
        });

        it('should throw an error and not record a call if rate limit is exceeded', () => {
            const rateLimiter = new ApiRateLimiter({
                maxRequests: 1,
                windowMs: 10 * 1000,
            });
            rateLimiter.enable();

            const fixedNow = 1710000000000;
            spyOn(Date, 'now').and.returnValue(fixedNow);

            rateLimiter.recordCallOrThrow('https://api.example.com/test');

            try {
                rateLimiter.recordCallOrThrow('https://api.example.com/test');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toBe(
                    `API rate limit exceeded: 1 requests to https://api.example.com/test in the last 10000ms (max: 1)`
                );
            }

            expect(rateLimiter.getCallCount('https://api.example.com/test')).toBe(1);
        });
    });
});
