import _ from 'lodash';
import service from '../../../../src/app/composer/directives/btnSendMessage';
import { generateModuleName } from '../../../utils/helpers';

describe('btnSendMessage directive', () => {

    const MODULE = generateModuleName();

    let dom, compile, scope, rootScope;
    let iscope, $, $$;

    const gettextCatalog = { getString: _.identity };

    angular.module(MODULE, ['templates-app'])
        .factory('gettextCatalog', () => gettextCatalog)
        .directive('btnSendMessage', service);

    beforeEach(angular.mock.module(MODULE));

    beforeEach(angular.mock.inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        compile = $injector.get('$compile');
        scope = rootScope.$new();
    }));

    describe('Compilation process', () => {

        beforeEach(() => {
            scope.message = 'message';
            spyOn(rootScope, '$on').and.callThrough();
            spyOn(gettextCatalog, 'getString').and.callThrough();
            dom = compile('<btn-send-message data-message="message"></btn-send-message>')(scope);
            scope.$digest();
            iscope = dom.isolateScope();
        });

        it('should replace da nodeName', () => {
            expect(dom[0].nodeName).toBe('BUTTON');
        });

        it('should create an isolate Scope', () => {
            expect(dom.isolateScope()).toBeDefined();
        });

        it('should bind the message', () => {
            expect(iscope.model).toBe('message');
        });

        it('should get the default translation', () => {
            expect(gettextCatalog.getString).toHaveBeenCalledWith('Send', null, 'Action');
        });

        it('should bind to the textContent the translation', () => {
            expect(dom[0].textContent).toBe('Send');
        });

        it('should record a listener', () => {
            expect(rootScope.$on).toHaveBeenCalledWith('actionMessage', jasmine.any(Function));
        });

    });


    describe('Step action message', () => {

        describe('Not the same message', () => {
            beforeEach(() => {
                scope.message = { ID: 1, encryptingAttachment: true };
                spyOn(rootScope, '$on').and.callThrough();
                spyOn(gettextCatalog, 'getString').and.callThrough();
                dom = compile('<btn-send-message data-message="message"></btn-send-message>')(scope);
                scope.$digest();
                iscope = dom.isolateScope();
                rootScope.$emit('actionMessage', { ID: 2 });
            });

            it('should get a custom translation', () => {
                expect(gettextCatalog.getString).toHaveBeenCalledWith('Encrypting attachments', null, 'Action');
            });

            it('should bind to the textContent the translation', () => {
                expect(dom[0].textContent).toBe('Encrypting attachments');
            });

            it('should not load a new translation', () => {
                expect(gettextCatalog.getString).not.toHaveBeenCalledWith('Send', null, 'Action');
            });

            it('should not set the button as disabled', () => {
                expect(dom[0].disabled).not.toBeTruthy();
            });


        });

        describe('The same message', () => {
            beforeEach(() => {
                scope.message = { ID: 1, encryptingAttachment: true };
                spyOn(rootScope, '$on').and.callThrough();
                spyOn(gettextCatalog, 'getString').and.callThrough();
                dom = compile('<btn-send-message data-message="message"></btn-send-message>')(scope);
                scope.$digest();
                iscope = dom.isolateScope();
            });

            it('should get get a custom translation', () => {
                expect(gettextCatalog.getString).toHaveBeenCalledWith('Encrypting attachments', null, 'Action');
            });

            it('should bind to the textContent the translation', () => {
                expect(dom[0].textContent).toBe('Encrypting attachments');
            });

            describe('State: uploading', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, uploading: 2 });
                });

                it('should load a new translation', () => {
                    expect(gettextCatalog.getString).toHaveBeenCalledWith('Uploading', null, 'Action');
                });

                it('should bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).toBe('Uploading');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });

            });

            describe('State: encrypting', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, encrypting: true });
                });

                it('should load a new translation', () => {
                    expect(gettextCatalog.getString).toHaveBeenCalledWith('Encrypting', null, 'Action');
                });

                it('should bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).toBe('Encrypting');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });

            });

            describe('State: sending', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, sending: true });
                });

                it('should load a new translation', () => {
                    expect(gettextCatalog.getString).toHaveBeenCalledWith('Sending', null, 'Action');
                });

                it('should bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).toBe('Sending');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });

            });

            describe('State: saving no autosaving', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, saving: true });
                });

                it('should not load a new translation', () => {
                    expect(gettextCatalog.getString).not.toHaveBeenCalledWith('Saving', null, 'Action');
                });

                it('should not bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).not.toBe('Saving');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });

            });

            describe('State: autosaving no saving', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, autosaving: true });
                });

                it('should not load a new translation', () => {
                    expect(gettextCatalog.getString).not.toHaveBeenCalledWith('Saving', null, 'Action');
                });

                it('should not bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).not.toBe('Saving');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });

            });

            describe('State: autosaving && saving', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, saving: true, autosaving: true });
                });

                it('should load a new translation', () => {
                    expect(gettextCatalog.getString).not.toHaveBeenCalledWith('Saving', null, 'Action');
                });

                it('should bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).not.toBe('Saving');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });

            });

            describe('State: !autosaving && saving', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', { ID: 1, saving: true, autosaving: false });
                });

                it('should load a new translation', () => {
                    expect(gettextCatalog.getString).toHaveBeenCalledWith('Saving', null, 'Action');
                });

                it('should bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).toBe('Saving');
                });

                it('should not set the button as disabled', () => {
                    expect(dom[0].disabled).not.toBeTruthy();
                });


            });

            describe('State: disableSend', () => {

                beforeEach(() => {
                    rootScope.$emit('actionMessage', {
                        ID: 1, disableSend() {
                            return true;
                        }
                    });
                });

                it('should load a new translation', () => {
                    expect(gettextCatalog.getString).toHaveBeenCalledWith('Send', null, 'Action');
                });

                it('should bind to the textContent the new translation', () => {
                    expect(dom[0].textContent).toBe('Send');
                });

                it('should set the button as disabled', () => {
                    expect(dom[0].disabled).toBeTruthy();
                });

            });

        });

    });


    describe('On Click', () => {

        beforeEach(() => {
            scope.message = 'message';
            spyOn(rootScope, '$emit');
            dom = compile('<btn-send-message data-message="message"></btn-send-message>')(scope);
            scope.$digest();
            iscope = dom.isolateScope();
            dom.triggerHandler('click');
        });

        it('should emit an event', () => {
            expect(rootScope.$emit).toHaveBeenCalledWith('composer.update', {
                type: 'send.message',
                data: {
                    message: 'message'
                }
            });
        });
    });


    describe('On $destroy', () => {

        beforeEach(() => {
            scope.message = { ID: 1 };
            dom = compile('<btn-send-message data-message="message"></btn-send-message>')(scope);
            scope.$digest();
            iscope = dom.isolateScope();
            spyOn(gettextCatalog, 'getString').and.callThrough();
            rootScope.$broadcast('$destroy');
            rootScope.$emit('actionMessage', { ID: 1, encrypting: true });
            spyOn(rootScope, '$emit');
        });

        it('should not emit an event on click', () => {
            dom.triggerHandler('click');
            expect(rootScope.$emit).not.toHaveBeenCalled();
        });


        it('should not load a new translation', () => {
            expect(gettextCatalog.getString).not.toHaveBeenCalledWith('Encrypting', null, 'Action');
        });

        it('should not bind to the textContent the new translation', () => {
            expect(dom[0].textContent).not.toBe('Encrypting');
        });

        it('should not set the button as disabled', () => {
            expect(dom[0].disabled).not.toBeTruthy();
        });
    });


});
