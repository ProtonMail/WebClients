import unary from './unary';

describe('unary()', () => {
    it('should handle functions with no arguments', () => {
        const myFunction = () => {
            return 'myFunction';
        };

        const unaryFunction = unary(myFunction);

        expect(unaryFunction('I still require an argument')).toEqual('myFunction');
    });

    it('should handle functions with a single argument', () => {
        const myFunction = (arg: string) => {
            return arg;
        };

        const unaryFunction = unary(myFunction);

        expect(unaryFunction('Argument')).toEqual('Argument');
    });

    it('should ensure only one argument is passed', () => {
        const myFunction = (name: string, index?: number) => {
            if (index === undefined) {
                return `Ola ${name}`;
            }
            return `Ola ${name} - ${index}`;
        };
        const names = ['Joao', 'Felix', 'Tareixa'];
        expect(names.map(myFunction)).toEqual(['Ola Joao - 0', 'Ola Felix - 1', 'Ola Tareixa - 2']);
        expect(names.map(unary(myFunction))).toEqual(['Ola Joao', 'Ola Felix', 'Ola Tareixa']);
    });
});
