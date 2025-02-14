import { AnonymousUserParticles, getRandomParticle } from './getRandomParticle';

describe('getRandomParticle', () => {
    let originalMathRandom: () => number;

    beforeEach(() => {
        originalMathRandom = Math.random;
    });

    afterEach(() => {
        Math.random = originalMathRandom;
    });

    it('should return a valid particle with name and color', () => {
        const result = getRandomParticle();

        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('color');
        expect(result.color).toHaveProperty('hsl');
        expect(Object.keys(AnonymousUserParticles)).toContain(result.name);
        expect(AnonymousUserParticles[result.name]).toBe(result.color.hsl);
    });

    it('should return correct particle for different random values', () => {
        const particles = Object.keys(AnonymousUserParticles);
        const testCases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        testCases.forEach((randomValue) => {
            Math.random = jest.fn().mockReturnValue(randomValue / 10);

            const result = getRandomParticle();
            const expectedParticle = particles[randomValue % particles.length];

            expect(result.name).toBe(expectedParticle);
            expect(result.color.hsl).toBe(AnonymousUserParticles[expectedParticle]);
        });
    });

    it('should return values within the bounds of available particles', () => {
        Math.random = jest.fn().mockReturnValue(0.99999);

        const result = getRandomParticle();
        expect(Object.keys(AnonymousUserParticles)).toContain(result.name);
    });

    it('should maintain constant mapping between particle and color', () => {
        Math.random = jest.fn().mockReturnValue(0.5);

        const firstResult = getRandomParticle();
        const secondResult = getRandomParticle();

        expect(firstResult).toEqual(secondResult);
    });
});
