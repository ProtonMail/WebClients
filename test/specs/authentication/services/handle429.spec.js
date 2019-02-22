import service from '../../../../src/app/authentication/services/handle429';
import { wait } from '../../../../src/helpers/promiseHelper';

describe('429 handler', () => {
    const config = {
        url: 'api/users'
    };

    let instance;
    let $httpMock;

    beforeEach(() => {
        $httpMock = jasmine.createSpy('$http');
        instance = service($httpMock);
    });

    it('should handle 429 and wait until it recalls', async () => {
        $httpMock.and.returnValue(Promise.resolve());
        const promise = instance({ config, headers: () => '1' });
        expect($httpMock).not.toHaveBeenCalled();
        await wait(50);
        expect($httpMock).not.toHaveBeenCalled();
        await promise;
        expect($httpMock).toHaveBeenCalledWith({ url: config.url, retryAttempt: 1 });
    });

    it('should reject when timeout is greater than 10', async () => {
        await expectAsync(instance({ config, headers: () => '10' })).toBeRejected();
    });

    it('should reject when attempts is greater than 5', async () => {
        await expectAsync(instance({ config, headers: () => '10', retryAttempt: 6 })).toBeRejected();
    });
});
