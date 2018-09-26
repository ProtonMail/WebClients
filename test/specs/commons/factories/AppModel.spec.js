import appModelService from '../../../../src/app/commons/factories/AppModel';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';
import { generateModuleName } from '../../../utils/helpers';

describe('AppModel factory', () => {
    const MODULE = generateModuleName();

    let AppModel,
        rootScope;

    angular.module(MODULE, [])
        .factory('AppModel', appModelService)
        .factory('dispatchers', dispatchersService);

    beforeEach(angular.mock.module(MODULE));

    beforeEach(angular.mock.inject(($injector) => {
        AppModel = $injector.get('AppModel');
        rootScope = $injector.get('$rootScope');
    }));

    describe('Set a key', () => {

        it('should return fasle', () => {
            expect(AppModel.is('funny')).toBe(false);
        });

        it('should set the value', () => {
            AppModel.set('funny', true);
            expect(AppModel.is('funny')).toBe(true);
        });

        it('should set the value and return undefined', () => {
            expect(AppModel.set('funny', true)).toBeUndefined();
        });

        it('should set the value', () => {
            expect(AppModel.is('test')).toBe(false);
            AppModel.set('test', { name: 'robert' });
            expect(AppModel.is('test')).toBe(true);
        });

        it('should dispatch an action on Set', () => {
            spyOn(rootScope, '$emit');
            AppModel.set('funny', true);
            expect(rootScope.$emit).toHaveBeenCalledTimes(1);
            expect(rootScope.$emit).toHaveBeenCalledWith('AppModel', {
                type: 'funny',
                data: {
                    value: true
                }
            });
        });

        it('should dispatch an action on Set once if value is === previous', () => {
            spyOn(rootScope, '$emit');
            AppModel.set('funny', true);
            AppModel.set('funny', true);
            AppModel.set('funny', true);
            AppModel.set('funny', true);
            expect(rootScope.$emit).toHaveBeenCalledTimes(1);
            expect(rootScope.$emit).toHaveBeenCalledWith('AppModel', {
                type: 'funny',
                data: {
                    value: true
                }
            });
        });

    });
});
