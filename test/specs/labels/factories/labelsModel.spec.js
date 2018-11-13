import _ from 'lodash';
import service from '../../../../src/app/labels/factories/labelsModel';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';

let spyInitCache = jasmine.createSpy();
let spyCacheSetter = jasmine.createSpy();
const labelCache = (cb) => {
    spyInitCache(cb);
    return {
        set() {
            cb();
            spyCacheSetter();
        }
    };
};

describe('[labels/factories] ~ labelsModel', () => {

    let factory, rootScope;
    let dispatcher;

    beforeEach(inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        spyOn(rootScope, '$on').and.callThrough();
        const dispatchers = dispatchersService(rootScope);
        factory = service(dispatchers, labelCache);
    }));

    it('should have created an instance of the cache', () => {
        expect(spyInitCache).toHaveBeenCalledTimes(1);
    })

    describe('Flush the cache on logout', () => {

        let dispatch;

        beforeEach(() => {
            spyInitCache = jasmine.createSpy();
            spyCacheSetter = jasmine.createSpy();
            spyOn(rootScope, '$emit').and.callThrough();
            dispatch = (type, value = true) => rootScope.$emit('AppModel', { type, data: { value } });
        });

        it('should listen to AppModel', () => {
            dispatch('toto');
            expect(rootScope.$on).toHaveBeenCalledWith('AppModel', jasmine.any(Function));
            expect(spyCacheSetter).not.toHaveBeenCalled();
            expect(rootScope.$emit).not.toHaveBeenCalledWith('labelsModel', {
                type: undefined, data: {}
            });
        });

        it('should do nothing if type !== loggedIn', () => {
            dispatch('toto');
            dispatch('toto', false);
            expect(spyCacheSetter).not.toHaveBeenCalled();
            expect(rootScope.$emit).not.toHaveBeenCalledWith('labelsModel', {
                type: undefined, data: {}
            });
        });

        it('should do nothing if type === loggedIn:true', () => {
            dispatch('loggedIn');
            expect(spyCacheSetter).not.toHaveBeenCalled();
            expect(rootScope.$emit).not.toHaveBeenCalledWith('labelsModel', {
                type: undefined, data: {}
            });
        });

        it('should flush the cache if type === loggedIn:false', () => {

            dispatch('loggedIn', false);
            expect(spyCacheSetter).toHaveBeenCalledTimes(1);
            expect(rootScope.$emit).toHaveBeenCalledWith('labelsModel', {
                type: undefined, data: {}
            });
        });
    });
});
