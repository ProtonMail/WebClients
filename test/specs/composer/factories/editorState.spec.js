import editorStateFactory from '../../../../src/app/squire/factories/editorState';

describe('editor state', () => {
    const ID = 1;
    const obj = {
        cb: () => {}
    };
    let editorState;

    beforeEach(() => {
        editorState = editorStateFactory();
    });

    it('should subscribe', () => {
        spyOn(obj, 'cb');
        editorState.on(ID, obj.cb);
        editorState.set(ID, {
            change: 1
        });
        expect(obj.cb).toHaveBeenCalledTimes(1);
        expect(obj.cb).toHaveBeenCalledWith({}, { change: 1 });
    });

    it('should subscribe to specific properties', () => {
        spyOn(obj, 'cb');
        editorState.on(ID, obj.cb, ['specific']);
        editorState.set(ID, {
            change: 1
        });
        editorState.set(ID, {
            specific: 1
        });
        expect(obj.cb).toHaveBeenCalledTimes(1);
        expect(obj.cb).toHaveBeenCalledWith({ change: 1 }, { change: 1, specific: 1 });
    });

    it('should unsubscribe', () => {
        spyOn(obj, 'cb');
        editorState.on(ID, obj.cb);
        editorState.set(ID, {
            change: 1
        });
        editorState.off(ID, obj.cb);
        editorState.set(ID, {
            change: 2
        });
        expect(obj.cb).toHaveBeenCalledTimes(1);
        expect(obj.cb).toHaveBeenCalledWith({}, { change: 1 });
    });
});
