import _ from 'lodash';
import service from '../../../../src/app/composer/directives/composer';
import AppModelService from '../../../../src/app/commons/factories/AppModel';
import MailSettingsModel from '../../../../src/app/settings/factories/mailSettingsModel';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';
import { generateModuleName } from '../../../utils/helpers';

describe('composer directive', () => {

    const MODULE = generateModuleName();

    let dom, compile, scope, rootScope;
    let iscope, $, $$;

    const gettextCatalog = { getString: _.identity };

    angular.module(MODULE, ['templates-app'])
        .factory('gettextCatalog', () => gettextCatalog)
        .factory('AppModel', AppModelService)
        .factory('mailSettingsModel', MailSettingsModel)
        .factory('dispatchers', dispatchersService)
        .directive('composer', service);

    beforeEach(angular.mock.module(MODULE));

    beforeEach(angular.mock.module(($provide) => {
        $provide.service('embedded', function() { return {} });
        $provide.service('attachmentFileFormat', function() { return {} });
    }));

    beforeEach(angular.mock.inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        compile = $injector.get('$compile');
        scope = rootScope.$new();
    }));

    describe('Save and send buttons', () => {
        beforeEach(() => {
            scope.message = {
                disableSave: () => false
            };
            scope.discard = () => {};
            scope.togglePanel = () => {};
            scope.selected = scope.message;
            spyOn(rootScope, '$on').and.callThrough();
            spyOn(gettextCatalog, 'getString').and.callThrough();
            dom = compile('<composer></composer>')(scope);
            scope.$digest();
            iscope = dom.isolateScope();
            spyOn(rootScope, '$emit');
        });

        it('should trigger send on click', () => {
            dom.find('.composer-btn-send').click();
            expect(rootScope.$emit).toHaveBeenCalledWith('editorListener', {
                type: 'pre.send.message',
                data: {
                    message: scope.message
                }
            });
        });

        it('should trigger save on click', () => {
            dom.find('.composer-btn-save').click();
            expect(rootScope.$emit).toHaveBeenCalledWith('editorListener', {
                type: 'pre.save.message',
                data: {
                    message: scope.message
                }
            });
        });

        it('should not trigger save if it is not selected', () => {
            scope.selected = undefined;
            scope.$digest();
            dom.find('.composer-btn-save').click();
            expect(rootScope.$emit).not.toHaveBeenCalled();
        });

        it('should trigger discard', () => {
            spyOn(scope, 'discard');
            dom.find('.composer-btn-discard').click();
            scope.$apply();
            expect(scope.discard).toHaveBeenCalledWith(scope.message);
        });

        it('should trigger encryption', () => {
            spyOn(scope, 'togglePanel');
            dom.find('.composer-btn-encryption').click();
            scope.$apply();
            expect(scope.togglePanel).toHaveBeenCalledWith(scope.message, 'encrypt');
        });

        it('should trigger expiration', () => {
            spyOn(scope, 'togglePanel');
            dom.find('.composer-btn-expiration').click();
            scope.$apply();
            expect(scope.togglePanel).toHaveBeenCalledWith(scope.message, 'expiration');
        });
    });

});
