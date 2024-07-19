/* eslint-disable class-methods-use-this */
import type { EditorPlugin, IEditor, PluginEvent } from 'roosterjs-editor-types';

import type { OnEditorEventListened } from '../../interface';

/**
 * This pluggin is here to dispatch editorEvents
 */
class EditorEventListener implements EditorPlugin {
    private onChange: OnEditorEventListened;

    private editor: IEditor | undefined;

    constructor(onChange: OnEditorEventListened) {
        this.onChange = onChange;
        this.editor = undefined;
    }

    getName() {
        return 'EditorEventListener';
    }

    initialize(editor: IEditor) {
        this.editor = editor;
    }

    dispose() {}

    onPluginEvent(e: PluginEvent) {
        if (!this.editor) {
            return;
        }

        this.onChange(e, this.editor);
    }
}

export default EditorEventListener;
