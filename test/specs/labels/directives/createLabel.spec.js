import service from '../../../../src/app/labels/directives/createLabel';
import { generateModuleName } from '../../../utils/helpers';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';

describe('CreateLabel directive', () => {

    const MODULE = generateModuleName();

    let dom, compile, scope, rootScope;
    let iscope, $, $$;
    let mockResponseLabel;
    const labelModal = {
        deactivate: angular.noop,
        activate({ params }) {
            params.close(mockResponseLabel);
        }
    };

    angular.module(MODULE, ['templates-app'])
        .factory('labelModal', () => labelModal)
        .factory('dispatchers', dispatchersService)
        .directive('createLabel', service);

    beforeEach(angular.mock.module(MODULE));

    beforeEach(angular.mock.inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        compile = $injector.get('$compile');
        scope = rootScope.$new();
    }));

    describe('Compilation process', () => {

        beforeEach(() => {
            scope.value = 'robert';
            scope.message = 'message';
            dom = compile('<create-label data-label-name="value" data-message="message"></create-label>')(scope);
            scope.$digest();
            iscope = dom.isolateScope();
        });

        it('should replace da nodeName', () => {
            expect(dom[0].nodeName).toBe('DIV');
        });

        it('should create an isolate Scope', () => {
            expect(dom.isolateScope()).toBeDefined();
        });

        it('should bind the name', () => {
            expect(iscope.name).toBe('robert');
        });

        it('should bind the message', () => {
            expect(iscope.message).toBe('message');
        });

    });

    describe('On Click', () => {

        describe('Without a message and no label', () => {
            beforeEach(() => {
                scope.value = 'robert';
                dom = compile('<create-label data-label-name="value" data-message="message"></create-label>')(scope);
                scope.$digest();
                iscope = dom.isolateScope();
                spyOn(labelModal, 'activate').and.callThrough();
                spyOn(labelModal, 'deactivate');
                spyOn(rootScope, '$emit').and.callThrough();
                mockResponseLabel = null;
                dom.triggerHandler('click');
            });

            it('should open a modal', () => {
                expect(labelModal.activate).toHaveBeenCalledWith({
                    params: {
                        label: {
                            Name: 'robert',
                            Exclusive: 0
                        },
                        close: jasmine.any(Function)
                    }
                });
            });

            it('should close the modal', () => {
                expect(labelModal.deactivate).toHaveBeenCalledWith();
            });

            it('should not emit a messageActions event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('messageActions', {
                    type: 'label',
                    data: jasmine.any(Object)
                });
            });

            it('should not emit a closeDropdown event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('closeDropdown');
            });

            it('should not emit a createLabel event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('createLabel', jasmine.any(Object));
            });
        });

        describe('Without a message and a label', () => {
            beforeEach(() => {
                scope.value = 'robert';
                dom = compile('<create-label data-label-name="value" data-message="message"></create-label>')(scope);
                scope.$digest();
                iscope = dom.isolateScope();
                spyOn(labelModal, 'activate').and.callThrough();
                spyOn(labelModal, 'deactivate');
                spyOn(rootScope, '$emit').and.callThrough();
                mockResponseLabel = { Name: 'polo' };
                dom.triggerHandler('click');
            });

            it('should open a modal', () => {
                expect(labelModal.activate).toHaveBeenCalledWith({
                    params: {
                        label: {
                            Name: 'robert',
                            Exclusive: 0
                        },
                        close: jasmine.any(Function)
                    }
                });
            });

            it('should close the modal', () => {
                expect(labelModal.deactivate).toHaveBeenCalledWith();
            });

            it('should not emit an event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('messageActions', {
                    type: 'label',
                    data: jasmine.any(Object)
                });
            });

            it('should not emit a closeDropdown event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalledWith('closeDropdown');
            });

            it('should emit a createLabel event', () => {
                expect(rootScope.$emit).toHaveBeenCalledWith('createLabel', {
                    type: 'new.label',
                    data: jasmine.any(Object)
                });
            });
        });

        describe('With a message and no label', () => {
            beforeEach(() => {
                scope.value = 'robert';
                scope.message = 'message';
                dom = compile('<create-label data-label-name="value" data-message="message"></create-label>')(scope);
                scope.$digest();
                iscope = dom.isolateScope();
                spyOn(labelModal, 'activate').and.callThrough();
                spyOn(labelModal, 'deactivate');
                spyOn(rootScope, '$emit');
                mockResponseLabel = null;
                dom.triggerHandler('click');
            });

            it('should open a modal', () => {
                expect(labelModal.activate).toHaveBeenCalledWith({
                    params: {
                        label: {
                            Name: 'robert',
                            Exclusive: 0
                        },
                        close: jasmine.any(Function)
                    }
                });
            });

            it('should close the modal', () => {
                expect(labelModal.deactivate).toHaveBeenCalledWith();
            });

            it('should not emit an event', () => {
                expect(rootScope.$emit).not.toHaveBeenCalled();
            });
        });

        describe('With a message and a label', () => {
            beforeEach(() => {
                scope.value = 'robert';
                scope.message = 'message';
                dom = compile('<create-label data-label-name="value" data-message="message"></create-label>')(scope);
                scope.$digest();
                iscope = dom.isolateScope();
                spyOn(labelModal, 'activate').and.callThrough();
                spyOn(labelModal, 'deactivate');
                spyOn(rootScope, '$emit');
                mockResponseLabel = { Name: 'polo' };
                dom.triggerHandler('click');
            });

            it('should open a modal', () => {
                expect(labelModal.activate).toHaveBeenCalledWith({
                    params: {
                        label: {
                            Name: 'robert',
                            Exclusive: 0
                        },
                        close: jasmine.any(Function)
                    }
                });
            });

            it('should close the modal', () => {
                expect(labelModal.deactivate).toHaveBeenCalledWith();
            });

            it('should emit a messageActions event', () => {
                expect(rootScope.$emit).toHaveBeenCalledWith('messageActions', {
                    type: 'label',
                    data: {
                        messages: ['message'],
                        labels: [{ Name: 'polo', Selected: true }]
                    }
                });
            });

            it('should emit 2 events: messageActions, closeDropdown and createLabel', () => {
                expect(rootScope.$emit).toHaveBeenCalledTimes(2);
            });
        });

    });

    describe('On $destroy', () => {

        beforeEach(() => {
            scope.value = 'robert';
            scope.message = 'message';
            dom = compile('<create-label data-label-name="value" data-message="message"></create-label>')(scope);
            scope.$digest();
            iscope = dom.isolateScope();
            spyOn(labelModal, 'activate').and.callThrough();
            spyOn(labelModal, 'deactivate');
            spyOn(rootScope, '$emit');
            mockResponseLabel = { Name: 'polo' };
            rootScope.$broadcast('$destroy');
            dom.triggerHandler('click');
        });

        it('should not try to open a modal', () => {
            expect(labelModal.activate).not.toHaveBeenCalled();
        });

        it('should not try to close the modal', () => {
            expect(labelModal.deactivate).not.toHaveBeenCalled();
        });

        it('should not emit an event', () => {
            expect(rootScope.$emit).not.toHaveBeenCalled();
        });

    });


});
