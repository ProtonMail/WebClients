import { useCallback, useRef } from 'react';

import { IEditor, PluginEvent, PluginEventType } from 'roosterjs-editor-types';

import useIsMounted from '@proton/hooks/useIsMounted';
import debounce from '@proton/utils/debounce';

import { SetEditorToolbarConfig } from '../../interface';

const EVENTS_TO_TRIGGER_ONCHANGE = [PluginEventType.Input, PluginEventType.ContentChanged];

const EVENTS_TO_HIDE_PLACEHOLDER = [PluginEventType.MouseDown, PluginEventType.KeyDown];

const TOOLBAR_EDITOR_EVENTS = [
    undefined,
    PluginEventType.EditorReady,
    PluginEventType.Input,
    PluginEventType.MouseUp,
    PluginEventType.ContentChanged,
    PluginEventType.KeyUp,
    PluginEventType.PendingFormatStateChanged,
];

interface Props {
    placeholder: string | undefined;
    setToolbarConfig: SetEditorToolbarConfig;
    onChange: ((value: string) => void) | undefined;
}

const useOnEditorChange = ({ placeholder, setToolbarConfig, onChange }: Props) => {
    const isPlaceholderVisibleRef = useRef(!!placeholder);
    const isMountedCallback = useIsMounted();

    const debouncedSetToolbarConfig = useCallback(
        debounce((editor: IEditor) => {
            if (!isMountedCallback()) {
                return;
            }
            setToolbarConfig(editor);
        }, 100),
        [setToolbarConfig, isMountedCallback]
    );

    const onChangeCallback = useCallback(
        (editorEvent: PluginEvent, editor: IEditor) => {
            const { eventType } = editorEvent;

            if (TOOLBAR_EDITOR_EVENTS.includes(eventType as any)) {
                debouncedSetToolbarConfig(editor);
            }

            if (
                isPlaceholderVisibleRef.current &&
                placeholder &&
                EVENTS_TO_HIDE_PLACEHOLDER.includes(eventType as any)
            ) {
                const content = editor.getContent();

                if (!content.includes(placeholder)) {
                    return;
                }

                isPlaceholderVisibleRef.current = false;
                editor.setContent('');
                return;
            }

            if (EVENTS_TO_TRIGGER_ONCHANGE.includes(editorEvent.eventType as any)) {
                const content = editor.getContent();
                onChange?.(content);
            }
        },
        [onChange]
    );

    return onChangeCallback;
};

export default useOnEditorChange;
