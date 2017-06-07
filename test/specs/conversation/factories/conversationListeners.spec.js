describe('conversationListeners factory', () => {

    let factory, rootScope, CONSTANTS;
    let spy = angular.noop;


    beforeEach(module('proton.conversation', 'proton.constants', 'proton.config', ($provide) => {
        $provide.factory('authentication', () => ({
            user: userMock
        }));

        $provide.decorator('$rootScope', ($delegate) => {
            const service = $delegate;
            const ghost = angular.copy(service.$on);
            service.$on = function (name, listener) {
                var namedListeners = this.$$listeners[name];
                if (!namedListeners) {
                  this.$$listeners[name] = namedListeners = [];
                }
                namedListeners.push(listener)
                return spy
            }
            return service;
        });

        $provide.factory('aboutClient', () => ({
            hasSessionStorage: angular.noop,
            prngAvailable: angular.noop
        }));

        $provide.factory('$state', () => ({
            go: angular.noop
        }));

        $provide.factory('$cookies', () => ({
            get: angular.noop,
            put: angular.noop
        }));
        $provide.factory('eventManager', () => ({
            setEventID: angular.noop,
            start: angular.noop,
            call: angular.noop,
            stop: angular.noop
        }));

        $provide.factory('tools', () => ({
            currentLocation: angular.noop,
            cacheContext: angular.noop
        }));
    }));

    beforeEach(inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        CONSTANTS = $injector.get('CONSTANTS');
        factory = $injector.get('conversationListeners');
    }));

    describe('Add subscriber with a draft', () => {

        let unsubscribe;
        let message;

        beforeEach(() => {
            spy = jasmine.createSpy();
            message = { Type: CONSTANTS.DRAFT };
            spyOn(rootScope, '$on').and.callThrough();
            unsubscribe = factory(message);
        });

        it('should record 3 listeners', () => {
            expect(rootScope.$on).toHaveBeenCalledTimes(3);
        });

        it('should record a listener replyConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('replyConversation', jasmine.any(Function));
        });

        it('should record a listener replyAllConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('replyAllConversation', jasmine.any(Function));
        });

        it('should record a listener forwardConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('forwardConversation', jasmine.any(Function));
        });

        it('should return a function', () => {
            expect(typeof unsubscribe).toBe('function');
        });

        describe('Emit replyConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('replyConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'reply'
                });
            })
        });

        describe('Emit replyAllConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('replyAllConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'replyall'
                });
            })
        });

        describe('Emit forwardConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('forwardConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'forward'
                });
            })
        });

        it('should unsubscribe 3 spies', () => {
            unsubscribe();
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('Add subscriber with a message:decrypted', () => {

        let unsubscribe;
        let message;

        beforeEach(() => {
            spy = jasmine.createSpy();
            message = { Type: CONSTANTS.INBOX };
            spyOn(rootScope, '$on').and.callThrough();
            unsubscribe = factory(message);
        });

        it('should record 3 listeners', () => {
            expect(rootScope.$on).toHaveBeenCalledTimes(3);
        });

        it('should record a listener replyConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('replyConversation', jasmine.any(Function));
        });

        it('should record a listener replyAllConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('replyAllConversation', jasmine.any(Function));
        });

        it('should record a listener forwardConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('forwardConversation', jasmine.any(Function));
        });

        it('should return a function', () => {
            expect(typeof unsubscribe).toBe('function');
        });

        describe('Emit replyConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('replyConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'reply'
                });
            })
        });

        describe('Emit replyAllConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('replyAllConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'replyall'
                });
            })
        });

        describe('Emit forwardConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('forwardConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'forward'
                });
            })
        });

        it('should unsubscribe 3 spies', () => {
            unsubscribe();
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });

    describe('Add subscriber with a message:failedDecryption', () => {

        let unsubscribe;
        let message;

        beforeEach(() => {
            spy = jasmine.createSpy();
            message = { Type: CONSTANTS.INBOX, failedDecryption: true };
            spyOn(rootScope, '$on').and.callThrough();
            unsubscribe = factory(message);
        });

        it('should record 3 listeners', () => {
            expect(rootScope.$on).toHaveBeenCalledTimes(3);
        });

        it('should record a listener replyConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('replyConversation', jasmine.any(Function));
        });

        it('should record a listener replyAllConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('replyAllConversation', jasmine.any(Function));
        });

        it('should record a listener forwardConversation', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('forwardConversation', jasmine.any(Function));
        });

        it('should return a function', () => {
            expect(typeof unsubscribe).toBe('function');
        });

        describe('Emit replyConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('replyConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'reply'
                });
            })
        });

        describe('Emit replyAllConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('replyAllConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'replyall'
                });
            })
        });

        describe('Emit forwardConversation', () => {

            beforeEach(() => {
                spyOn(rootScope, '$emit').and.callThrough();
                rootScope.$emit('forwardConversation');
                rootScope.$digest();
            });

            it('should not call the composer.new event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('composer.new', {
                    message,
                    type: 'forward'
                });
            })
        });

        it('should unsubscribe 3 spies', () => {
            unsubscribe();
            expect(spy).toHaveBeenCalledTimes(3);
        });
    });
});
