import { RefObject, useCallback, useEffect, useRef } from 'react';
import { IEditor } from 'roosterjs-editor-types';

import { initRoosterEditor } from '../helpers/initRoosterEditor';
import { useIsMounted } from '../../../../hooks';
import { EditorActions, OnEditorEventListened } from '../../interface';
import { EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID, ROOSTER_EDITOR_ID, ROOSTER_EDITOR_WRAPPER_ID } from '../../constants';

import iframeCss from '../RoosterEditorIframe.raw.scss';
import { ModalLinkProps } from '../../hooks/useModalLink';

interface Props {
    /**
     * Container ref on which rooster instanciate
     */
    iframeRef: RefObject<HTMLIFrameElement>;
    onReady: (editorActions: EditorActions) => void;
    /**
     * Notifies editor events
     */
    onEditorChange: OnEditorEventListened;
    initialContent?: string;
    showModalLink: (props: ModalLinkProps) => void;
}

const useInitRooster = ({ iframeRef, onReady, onEditorChange, initialContent, showModalLink }: Props) => {
    const editorRef = useRef<IEditor>();
    const isMounted = useIsMounted();

    const initRooster = useCallback(async () => {
        const iframe = iframeRef.current as HTMLIFrameElement;
        const iframeDocument = iframe.contentWindow?.document as Document;

        iframeDocument.open();
        iframeDocument.write(`
        <head>
            <style>
                ${iframeCss}
                .proton-embedded:not([src]){
                    background: url('/assets/img/icons/broken-img.png') no-repeat 0 50% white;
                }
                .proton-embedded[alt]:not([src])::after {
                    background: url('/assets/img/icons/broken-img.png') no-repeat 0 50% white;
                }
            </style>
        </head>
        <body>
        <div id="proton-editor-container">
            <div id="rooster-editor-wrapper">
                <div id="${ROOSTER_EDITOR_ID}"></div>
                <div id="${EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID}"></div>
            </div>
        </div>
        </body>
        `);
        iframeDocument.close();

        const editorDiv = iframeDocument.getElementById(ROOSTER_EDITOR_ID) as HTMLDivElement;

        const { editor, actions } = await initRoosterEditor(editorDiv, {
            onEditorEvent: onEditorChange,
            initialContent,
            showModalLink,
        });

        // Prevent setState execution in case component is unmounted
        if (!isMounted()) {
            return;
        }

        onReady(actions);

        return editor;
    }, []);

    useEffect(() => {
        const isEditorReady = editorRef.current !== undefined;

        if (isEditorReady) {
            return;
        }

        void initRooster()
            .then((editorInstance) => {
                editorRef.current = editorInstance;
            })
            .then(() => {
                const editorWrapper = iframeRef.current?.contentDocument?.getElementById(ROOSTER_EDITOR_WRAPPER_ID);

                editorWrapper?.addEventListener('click', () => {
                    editorRef.current?.focus();
                });
            });

        return () => {
            editorRef.current?.dispose();
            editorRef.current = undefined;
        };
    }, []);
};

export default useInitRooster;
