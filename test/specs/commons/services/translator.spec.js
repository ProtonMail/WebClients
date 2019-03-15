import service from '../../../../src/app/commons/services/translator';


describe('Translator service', () => {

    let translator, rootScope;

    beforeEach(angular.mock.inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        spyOn(rootScope, '$on').and.callThrough();
    }));

    describe('Init', () => {
        beforeEach(() => {
            translator = service(rootScope);
        });

        it('should attach a listener when we change the lang', () => {
            expect(rootScope.$on).toHaveBeenCalledTimes(1);
            expect(rootScope.$on).toHaveBeenCalledWith('gettextLanguageChanged', jasmine.any(Function));
        });

        [
            { type: 'null', value: null },
            { type: 'boolean', value: true },
            { type: 'number', value: 1 },
            { type: 'undefined' },
            { type: 'string', value: 'dew' },
            { type: 'array', value: [] }
        ].forEach(({ type, value }) => {
            it(`should throw an error if the arg is ${type}`, () => {
                expect(() => {
                    translator(value);
                }).toThrowError('[commons@translator] Translator service takes a callback as param. This callback must return an object');
            });
        });
    });

    describe('Swicth translations', () => {
        let data;
        let getText = () => 'pedro';

        beforeEach(angular.mock.inject(($injector) => {
            rootScope = $injector.get('$rootScope');
            translator = service(rootScope);
            data = translator(() => ({
                name: getText()
            }));
        }));

        it('should get an object', () => {
            expect(data).toEqual({
                name: 'pedro'
            });
        });

        it('should update the ref', () => {
            getText = () => 'jeanne';
            rootScope.$emit('gettextLanguageChanged');
            rootScope.$digest();
            expect(data).toEqual({
                name: 'jeanne'
            });
        });

    });


});
