import service from '../../../../src/app/authentication/services/compatApi';

describe('compat api', () => {
    let instance;
    let $httpMock;
    let urlMock;

    beforeEach(() => {
        $httpMock = jasmine.createSpy('$http');
        urlMock = {
            get: jasmine.createSpy('get')
        };
        $httpMock.and.returnValue(Promise.resolve({ data: 'foo' }));
        instance = service($httpMock, urlMock);
    });

    it('should unload the result correctly', async () => {
        const result = await instance({ url: 'auth/info' });
        expect(result).toBe('foo');
    });

    it('should prefix api base correctly when it is local', async () => {
        urlMock.get.and.returnValue('/api');
        await instance({ url: 'auth/info', headers: { foo: 'bar' } });
        expect($httpMock).toHaveBeenCalledWith({ url: '/api/auth/info', headers: { foo: 'bar' } });
    });

    it('should prefix api base correctly when it starts with http', async () => {
        urlMock.get.and.returnValue('https://dev.protonmail.com/api');
        await instance({ url: 'auth/info', headers: { foo: 'bar' } });
        expect($httpMock).toHaveBeenCalledWith({ url: 'https://dev.protonmail.com/api/auth/info', headers: { foo: 'bar' } });
    });
});
