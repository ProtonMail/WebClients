import service from '../../../../src/app/squire/factories/squireEditor';
import editorModelService from '../../../../src/app/squire/factories/editorModel';
import sanitizeService from '../../../../src/app/utils/services/sanitize';
import dispatchersService from '../../../../src/app/commons/services/dispatchers';

describe('squire editor', () => {
    let squireEditor;
    let dom;
    let compile;
    let rootScope;
    let scope;
    let sanitize;

    beforeEach(angular.mock.inject(($injector) => {
        rootScope = $injector.get('$rootScope');
        compile = $injector.get('$compile');
        scope = rootScope.$new();

        const dispatchers = dispatchersService(rootScope);
        const editorModel = editorModelService();
        sanitize = sanitizeService();
        squireEditor = service(dispatchers, editorModel, sanitize);
    }));

    beforeEach(() => {
        dom = compile('<iframe></iframe>')(scope);
        // Append the body so that the iframe onload event is triggered.
        document.body.appendChild(dom[0]);
    });

    afterEach(() => {
        document.body.removeChild(dom[0]);
    });

    it('should set a grammarly disabled attribute', async () => {
        const editor = await squireEditor.create(dom, {}, '');
        expect(editor._root.dataset.enableGrammarly).toEqual('false');
    });

    it('should extend the api', async () => {
        const editor = await squireEditor.create(dom, {}, '');
        expect(editor.setTextDirectionLTR).toBeDefined();
    });

    it('should call OUR sanitize function when new content is inserted', async () => {
        spyOn(sanitize, 'content');
        const editor = await squireEditor.create(dom, {}, '');
        editor.setHTML('asd');
        expect(sanitize.content).toHaveBeenCalled();
    });
});
