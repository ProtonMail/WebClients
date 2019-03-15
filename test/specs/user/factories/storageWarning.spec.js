import { STORAGE_WARNING } from '../../../../src/app/constants';
import storageWarningService from '../../../../src/app/user/factories/storageWarning';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';
import { generateModuleName } from '../../../utils/helpers';

describe('storage warning', () => {
    const MODULE = generateModuleName();
    let rootScope;
    let storageWarning;

    const authentication = {
        user: {}
    };

    const mockState = {};
    const mockAppModel = {
        set: () => {}
    };
    const mockTranslator = () => (cb) => cb();

    const mockModal = {};

    angular.module(MODULE, ['gettext'])
        .factory('confirmModal', () => mockModal)
        .factory('$state', () => mockState)
        .factory('storageWarning', storageWarningService)
        .factory('AppModel', () => mockAppModel)
        .factory('authentication', () => authentication)
        .factory('dispatchers', dispatchersService)
        .factory('translator', mockTranslator);

    beforeEach(angular.mock.module(MODULE));

    beforeEach(angular.mock.inject(($injector, _storageWarning_, $rootScope) => {
        mockModal.activate = jasmine.createSpy('activate');
        mockModal.deactivate = jasmine.createSpy('deactivate');

        localStorage.removeItem(STORAGE_WARNING.KEY);

        rootScope = $injector.get('$rootScope');
        storageWarning = _storageWarning_;
        rootScope = $rootScope;
    }));

    const setUser = (usedSpace, maxSpace) => {
        authentication.user.UsedSpace = usedSpace;
        authentication.user.MaxSpace = maxSpace;
        rootScope.$emit('updateUser');
    };

    it('should return false when limit is not reached', () => {
        setUser(99, 100);

        expect(storageWarning.isLimitReached())
            .toBe(false);
    });

    it('should return true when limit reached', () => {
        setUser(100, 100);
        expect(storageWarning.isLimitReached())
            .toBe(true);
    });

    it('should not show the modal when the limit is not reached', () => {
        setUser(0, 100);

        expect(mockModal.activate)
            .not
            .toHaveBeenCalled();
    });

    it('should not show the modal when limit reached and do not remind is set', () => {
        localStorage.setItem(STORAGE_WARNING.KEY, STORAGE_WARNING.VALUE);
        setUser(100, 100);

        expect(mockModal.activate)
            .not
            .toHaveBeenCalled();
    });

    it('should show the modal when limit reached and storage has changed', () => {
        setUser(100, 100);

        expect(mockModal.activate)
            .toHaveBeenCalled();
    });
});
