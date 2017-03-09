describe('paginationModel factory', () => {

    let factory, rootScope, cacheCounters, authentication, state, CONSTANTS;
    let userMock = {};
    let stateParamsMock = {};

    beforeEach(module('proton.core', 'proton.constants', 'proton.config', ($provide) => {
        $provide.factory('authentication', () => ({
            user: userMock
        }));

        $provide.factory('$state', () => ({
            go: angular.noop
        }));

        $provide.factory('cacheCounters', () => ({
            getCurrentState: angular.noop,
            getCounter: angular.noop
        }));
        $provide.factory('$stateParams', () => stateParamsMock);
    }));

    beforeEach(inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        CONSTANTS = $injector.get('CONSTANTS');
        cacheCounters = $injector.get('cacheCounters');
        authentication = $injector.get('authentication');
        state = $injector.get('$state');
        factory = $injector.get('paginationModel');
        factory.init();
    }));

    describe('Switch page', () => {

        describe('No options', () => {

            beforeEach(() => {
                spyOn(state, 'go');
                factory.to();
            });

            it('should move to another state', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null })
            });
        });

        describe('With options', () => {

            beforeEach(() => {
                spyOn(state, 'go');
                factory.to({ label: 'polo' });
            });

            it('should move to another state', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, label: 'polo' });
            });
        });

        describe('Custom state, with options', () => {

            beforeEach(() => {
                rootScope.$emit('$stateChangeSuccess', { name: 'monique' });
                spyOn(state, 'go');
                factory.to({ label: 'polo' });
            });

            it('should move to another state', () => {
                expect(state.go).toHaveBeenCalledWith('monique', { id: null, label: 'polo' });
            });
        });

    });

    describe('Page max', () => {

        describe('State default no counter', () => {
            let total;
            beforeEach(() => {
                spyOn(cacheCounters, 'getCounter').and.returnValue();
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            })

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith(undefined);
            });

            it('should not get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(1);
            });

        });

        describe('State default and counter', () => {
            let total;
            beforeEach(() => {
                userMock = { ViewMode: CONSTANTS.MESSAGE_VIEW_MODE };
                spyOn(cacheCounters, 'getCounter').and.returnValue({
                    message: {
                        total: 110
                    }
                });
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            })

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith(undefined);
            });

            it('should not get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(1);
            });

        });

        describe('State label no counter', () => {
            let total;
            beforeEach(() => {
                userMock = { ViewMode: CONSTANTS.MESSAGE_VIEW_MODE };
                stateParamsMock.label = 'monique';
                spyOn(cacheCounters, 'getCounter').and.returnValue();
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            })

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith('monique');
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(1);
            });

            it('should not get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
            });
        });

        describe('State label and counter', () => {
            let total;
            beforeEach(() => {
                userMock = { ViewMode: CONSTANTS.MESSAGE_VIEW_MODE };
                stateParamsMock.label = 'monique';
                spyOn(cacheCounters, 'getCounter').and.returnValue({
                    message: {
                        total: 110
                    }
                });
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(10);
                total = factory.getMaxPage();
            })

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith('monique');
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(Math.ceil(110 / CONSTANTS.ELEMENTS_PER_PAGE));
            });

            it('should not get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
            });
        });

        describe('State label and counter (converstations)', () => {
            let total;
            beforeEach(() => {
                userMock = { ViewMode: CONSTANTS.CONVERSATION_VIEW_MODE };
                stateParamsMock.label = 'monique';
                spyOn(cacheCounters, 'getCounter').and.returnValue({
                    message: {
                        total: 110
                    },
                    conversation: {
                        total: CONSTANTS.ELEMENTS_PER_PAGE * 10
                    }
                });
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(1);
                total = factory.getMaxPage();
            })

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith('monique');
            });

            it('should total of pages', () => {
                expect(total).toBe(10);
            });

            it('should not get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
            });
        });

        describe('State custom total empty', () => {
            let total;
            beforeEach(() => {
                spyOn(cacheCounters, 'getCounter').and.returnValue();
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(CONSTANTS.ELEMENTS_PER_PAGE + 1);
                delete stateParamsMock.label;
                factory.setMaxPage();
                total = factory.getMaxPage();
            })

            it('should get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).toHaveBeenCalled();
                expect(cacheCounters.getCurrentState).toHaveBeenCalledTimes(1);
            });

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith(undefined);
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(2);
            });

        });

        describe('State custom total', () => {
            let total;
            beforeEach(() => {
                spyOn(cacheCounters, 'getCounter').and.returnValue();
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(1000);
                delete stateParamsMock.label;
                factory.setMaxPage(CONSTANTS.ELEMENTS_PER_PAGE * 3);
                total = factory.getMaxPage();
            })

            it('should not get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).not.toHaveBeenCalled();
            });

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith(undefined);
            });

            it('should return the default pageMax', () => {
                expect(total).toBe(3);
            });

        });

        describe('State custom total null and async currentState', () => {
            let total;
            let i;
            beforeEach(() => {
                i = 0;
                spyOn(cacheCounters, 'getCounter').and.returnValue();
                spyOn(cacheCounters, 'getCurrentState').and.callFake(() => {
                    i++;
                    if (i === 2) {
                        return CONSTANTS.ELEMENTS_PER_PAGE * 5
                    }
                    return 0;
                });
                delete stateParamsMock.label;
                factory.setMaxPage();
                total = factory.getMaxPage();
            })

            it('should get counters for the current state', () => {
                expect(cacheCounters.getCurrentState).toHaveBeenCalled();
                expect(cacheCounters.getCurrentState).toHaveBeenCalledTimes(2);
            });

            it('should get counters', () => {
                expect(cacheCounters.getCounter).toHaveBeenCalledWith(undefined);
            });

            it('should custom page max', () => {
                expect(total).toBe(5);
            });

        });
    });

    describe('Previous page', () => {

        describe('No page', () => {

            beforeEach(() => {
                spyOn(state, 'go');
                factory.previous();
            });

            it('should not switch to another page', () => {
                expect(state.go).not.toHaveBeenCalled();
            });
        });

        describe('Wrong query params', () => {

            beforeEach(() => {
                stateParamsMock.page = 'monique';
                spyOn(state, 'go');
                factory.previous();
            });

            it('should not switch to another page', () => {
                expect(state.go).not.toHaveBeenCalled();
            });
        });

        describe('With a page number', () => {

            beforeEach(() => {
                stateParamsMock.page = 10;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: 9 });
            });
        });

        describe('From page 1', () => {

            beforeEach(() => {
                stateParamsMock.page = 1;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: undefined });
            });
        });

        describe('From page 2', () => {

            beforeEach(() => {
                stateParamsMock.page = 2;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: undefined });
            });
        });

        describe('From page 3', () => {

            beforeEach(() => {
                stateParamsMock.page = 3;
                spyOn(state, 'go');
                factory.previous();
            });

            it('should switch to another page', () => {
                expect(state.go).toHaveBeenCalledWith('', { id: null, page: 2 });
            });
        });
    });

    describe('Next page', () => {

        describe('default pageMax = 1', () => {
            describe('No page', () => {

                beforeEach(() => {
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should not switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });

            describe('Wrong query params', () => {

                beforeEach(() => {
                    stateParamsMock.page = 'monique';
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should not switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });

            describe('With a page number', () => {

                beforeEach(() => {
                    stateParamsMock.page = 2;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should not switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });
        });

        describe('default pageMax = 10', () => {

            beforeEach(() => {
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(CONSTANTS.ELEMENTS_PER_PAGE * 10);
                delete stateParamsMock.page;
                factory.setMaxPage();
            })

            describe('No page', () => {

                beforeEach(() => {
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 2 });
                });
            });

            describe('Wrong query params', () => {

                beforeEach(() => {
                    stateParamsMock.page = 'monique';
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 2 });
                });
            });

            describe('With a page number', () => {

                beforeEach(() => {
                    stateParamsMock.page = 2;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 3 });
                });
            });

            describe('With a page number < 10', () => {

                beforeEach(() => {
                    stateParamsMock.page = 9;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).toHaveBeenCalledWith('', { id: null, page: 10 });
                });
            });

            describe('With a page number === 10', () => {

                beforeEach(() => {
                    stateParamsMock.page = 10;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });

            describe('With a page number > 10', () => {

                beforeEach(() => {
                    stateParamsMock.page = 11;
                    spyOn(state, 'go');
                    factory.next();
                });

                it('should switch to another page', () => {
                    expect(state.go).not.toHaveBeenCalled();
                });
            });
        });

    });

    describe('Check if page number is maxPageNumber', () => {

        describe('Default page max 1', () => {

            beforeEach(() => {
                spyOn(state, 'go');
            });

            it('should return true if page is > 1', () => {
                stateParamsMock.page = 2;
                expect(factory.isMax()).toBe(true);
            });

            it('should return true if page is === 1', () => {
                stateParamsMock.page = 1;
                expect(factory.isMax()).toBe(true);
            });

            it('should return true if page is undefined', () => {
                delete stateParamsMock.page;
                expect(factory.isMax()).toBe(true);
            });
        });

        describe('Custom page max 10', () => {

            beforeEach(() => {
                spyOn(cacheCounters, 'getCurrentState').and.returnValue(CONSTANTS.ELEMENTS_PER_PAGE * 10);
                delete stateParamsMock.page;
                factory.setMaxPage();
                spyOn(state, 'go');
            });

            it('should return true if page is > 10', () => {
                stateParamsMock.page = 11;
                expect(factory.isMax()).toBe(true);
            });

            it('should return true if page is === 10', () => {
                stateParamsMock.page = 10;
                expect(factory.isMax()).toBe(true);
            });

            it('should return false if page is < 10', () => {
                stateParamsMock.page = 9;
                expect(factory.isMax()).toBe(false);
            });

            it('should return false if page is undefined', () => {
                delete stateParamsMock.page;
                expect(factory.isMax()).toBe(false);
            });

        });
    })


});
