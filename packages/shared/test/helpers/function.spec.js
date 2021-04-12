import { randomIntFromInterval, unary } from '../../lib/helpers/function';

describe('Functions', () => {
    describe('Random int', () => {
        it('should generate random integers in range', () => {
            const list = Array.from({ length: 100 }, () => randomIntFromInterval(1, 100));
            const test = list.some((n) => n < 1 || n > 100);
            expect(test).toEqual(false);
        });
    });

    describe('unary', () => {
        it('should ensure only one argument is passed', () => {
            const myFunction = (name, index) => {
                return index !== undefined ? `Ola ${name} - ${index}` : `Ola ${name}`;
            };
            const names = ['Joao', 'Felix', 'Tareixa'];
            expect(names.map(myFunction)).toEqual(['Ola Joao - 0', 'Ola Felix - 1', 'Ola Tareixa - 2']);
            expect(names.map(unary(myFunction))).toEqual(['Ola Joao', 'Ola Felix', 'Ola Tareixa']);
        });
    });
});
