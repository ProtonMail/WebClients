import service from '../../../../src/app/authentication/interceptors/httpInterceptor';

describe('http interceptor', () => {
    const MOCKS = {
        tryAgainModel: {},
        gettextCatalog: {},
        notification: {}
    };
    const $qMock = {};
    const $injectorMock = {
        get(key) {
            return MOCKS[key];
        }
    };
    const appModelMock = {};
    const networkUtilsMock = {};

    let instance;

    const config = {
        url: 'api/users'
    };

    beforeEach(() => {
        MOCKS.handleTryAgain = jasmine.createSpy('handleTryAgain');
        MOCKS.tryAgainModel.check = jasmine.createSpy('check');
        MOCKS.gettextCatalog.getString = jasmine.createSpy('getTextCatalog')
            .and
            .callFake((args) => args);
        MOCKS.notification.error = jasmine.createSpy('error');
        MOCKS.notification.closeAll = jasmine.createSpy('closeAll');
        MOCKS.notification.disableClose = jasmine.createSpy('disableClose');
        MOCKS.handle401 = jasmine.createSpy('handle401');
        MOCKS.handle9001 = jasmine.createSpy('handle9001');
        MOCKS.unlockUser = jasmine.createSpy('unlockUser');
        MOCKS.$http = jasmine.createSpy('$http');

        appModelMock.set = jasmine.createSpy('app model set');
        networkUtilsMock.isCancelledRequest = jasmine.createSpy('isCancelledRequest');

        $qMock.reject = jasmine.createSpy('reject')
            .and
            .callFake((arg) => Promise.reject(arg));

        instance = service($qMock, $injectorMock, appModelMock, networkUtilsMock);
    });

    describe('offline', () => {
        it('should not do anything if the status is not offline or cancel', () => {
            instance.responseError({ status: 400, config });
            instance.responseError({ status: 1, config });
            instance.responseError({ status: -2, config });

            expect(MOCKS.tryAgainModel.check)
                .not
                .toHaveBeenCalled();
            expect(MOCKS.handleTryAgain)
                .not
                .toHaveBeenCalled();
        });

        it('should try again', () => {
            instance.responseError({ status: 0, config });

            expect(MOCKS.notification.error)
                .not
                .toHaveBeenCalled();
            expect(MOCKS.handleTryAgain)
                .toHaveBeenCalled();
        });

        it('should show the offline error', () => {
            MOCKS.tryAgainModel.check.and.returnValue(true);

            instance.responseError({ status: 0, config });

            expect(MOCKS.notification.error)
                .toHaveBeenCalled();
            expect(MOCKS.handleTryAgain)
                .toHaveBeenCalled();
        });

        it('should not show the offline error if noOfflineNotify is set', () => {
            MOCKS.tryAgainModel.check.and.returnValue(true);

            instance.responseError({
                status: 0,
                config: { ...config, noOfflineNotify: true }
            });

            expect(MOCKS.notification.error)
                .not
                .toHaveBeenCalled();
            expect(MOCKS.handleTryAgain)
                .toHaveBeenCalled();
        });
    });

    describe('http status', () => {
        const config = {
            url: 'api/users'
        };

        [400, 402, 404, 500, 0, -1, -2].forEach((status) => {
            it(`should not do anything on an unspecified status ${status}`, () => {
                instance.responseError({ status, config });
                expect(MOCKS.handle401)
                    .not
                    .toHaveBeenCalled();
                expect(MOCKS.unlockUser)
                    .not
                    .toHaveBeenCalled();
                expect(MOCKS.$http)
                    .not
                    .toHaveBeenCalled();
                expect(MOCKS.notification.error)
                    .not
                    .toHaveBeenCalled();
            });
        });

        it('should handle 401', () => {
            instance.responseError({ status: 401, config });
            expect(MOCKS.handle401)
                .toHaveBeenCalled();
        });

        it('should handle 403', async () => {
            MOCKS.unlockUser.and.returnValue(Promise.resolve());
            await instance.responseError({ status: 403, config });
            expect(MOCKS.unlockUser)
                .toHaveBeenCalled();
            expect(MOCKS.$http)
                .toHaveBeenCalled();
        });

        it('should handle 504', () => {
            instance.responseError({ status: 504, config });
            expect(MOCKS.notification.error)
                .toHaveBeenCalled();
        });

        [408, 503].forEach((status) => {
            it(`should handle ${status}`, () => {
                instance.responseError({ status, config });
                expect(MOCKS.notification.error)
                    .toHaveBeenCalled();
            });
        });
    });

    describe('custom error', () => {
        it('should not show any error message if there is no error message', () => {
            instance.responseError({
                status: 400,
                data: {
                    Code: 123123
                }
            });
            expect(MOCKS.notification.error)
                .not
                .toHaveBeenCalled();
        });

        it('should handle human verification', () => {
            instance.responseError({
                status: 400,
                data: {
                    Code: 9001
                }
            });
            expect(MOCKS.handle9001)
                .toHaveBeenCalled();
        });

        describe('bad version', () => {
            beforeEach(() => {
                instance.responseError({
                    status: 400,
                    data: {
                        Code: 5003,
                        Error: 'API Message'
                    }
                });
            });

            it('should show persistent error notification', () => {
                expect(MOCKS.notification.closeAll)
                    .toHaveBeenCalled();
                expect(MOCKS.notification.disableClose)
                    .toHaveBeenCalled();
                expect(MOCKS.notification.error)
                    .toHaveBeenCalledWith('API Message', {
                        templateUrl: 'templates/notifications/badVersion.tpl.html',
                        duration: '0'
                    });
            });

            it('should stop requests until you refresh', () => {
                return instance.request(config)
                    .catch((e) => {
                        expect(e.noNotify)
                            .toBe(true);
                        expect(e.status)
                            .toBe(-2);
                    });
            });

            it('should not stop requests on templates', () => {
                const config = { url: '/templates/index.html' };
                expect(instance.request(config))
                    .toEqual(config);
            });

            it('should not stop requests on assets', () => {
                const config = { url: '/assets/index.html' };
                expect(instance.request(config))
                    .toEqual(config);
            });
        });

        [124124, 4000, 5000].forEach((Code) => {
            it(`should show an error notification for ${Code} and still pass through requests`, () => {
                instance.responseError({
                    status: 400,
                    data: {
                        Code,
                        Error: 'API Message'
                    }
                });
                expect(MOCKS.notification.closeAll)
                    .not
                    .toHaveBeenCalled();
                expect(MOCKS.notification.disableClose)
                    .not
                    .toHaveBeenCalled();
                expect(MOCKS.notification.error)
                    .toHaveBeenCalledWith('API Message', undefined);
                expect(instance.request(config))
                    .toEqual(config);
            });
        });

        [
            {
                Code: 5004,
                message: 'Non-integer API version requested.'
            },
            {
                Code: 5005,
                message: 'Unsupported API version.'
            },
            {
                Code: 7001,
                message: 'The ProtonMail API is offline: API Message'
            }
        ].forEach(({ Code, message }) => {
            it(`should show error notification for ${Code} and set noNotify`, () => {
                const error = {
                    status: 400,
                    data: {
                        Code,
                        Error: 'API Message'
                    }
                };
                instance.responseError(error);
                expect(error.noNotify)
                    .toBeTruthy();
                expect(MOCKS.notification.error)
                    .toHaveBeenCalledWith(message, undefined);
            });
        });
    });
});
