import type { SimpleEditorProps } from '../../containers/editor/SimpleEditorContext';
import Editor from './Editor';
import { useToolbar } from './hooks/useToolbar';

const SimpleEditor = ({ supportFiles, ...rest }: SimpleEditorProps) => {
    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        {}
    );

    return (
        <Editor
            {...rest}
            metadata={supportFiles === undefined ? undefined : { supportFiles }}
            simple
            openEmojiPickerRef={openEmojiPickerRef}
            toolbarConfig={toolbarConfig}
            setToolbarConfig={setToolbarConfig}
            modalLink={modalLink}
            modalImage={modalImage}
            modalDefaultFont={modalDefaultFont}
        />
    );
};

export default SimpleEditor;
