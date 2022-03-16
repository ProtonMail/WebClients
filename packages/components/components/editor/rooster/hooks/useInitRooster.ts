import { RefObject, useCallback, useEffect, useRef } from 'react';
import { IEditor } from 'roosterjs-editor-types';

import { MailSettings } from '@proton/shared/lib/interfaces';
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
    onFocus?: () => void;
    /**
     * Notifies editor events
     */
    onEditorChange: OnEditorEventListened;
    initialContent?: string;
    mailSettings?: MailSettings;
    showModalLink: (props: ModalLinkProps) => void;
    onPasteImage: (image: File) => void;
}

const useInitRooster = ({
    iframeRef,
    onReady,
    onEditorChange,
    initialContent,
    showModalLink,
    onFocus,
    mailSettings,
    onPasteImage,
}: Props) => {
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
        <svg class="proton-hidden">
            <g id="ic-file-shapes">
                <path d="M14 15L14 3.89L13.85 3.74C12.85 2.74 12.26 2.17 11.26 1.15L11.11 1L2 1L2 15L14 15ZM11 2.31L12.69 4L11 4V2.31ZM3 2L10 2V5L13 5L13 14L3 14L3 2Z"></path>
                <path d="M7 10H6V11H7V10ZM5 9V12H8V9H5Z"></path>
                <path d="M9.5 8C9.77614 8 10 7.77614 10 7.5C10 7.22386 9.77614 7 9.5 7C9.22386 7 9 7.22386 9 7.5C9 7.77614 9.22386 8 9.5 8ZM9.5 9C10.3284 9 11 8.32843 11 7.5C11 6.67157 10.3284 6 9.5 6C8.67157 6 8 6.67157 8 7.5C8 8.32843 8.67157 9 9.5 9Z"></path>
            </g>
            <g id="ic-circle-xmark">
                <path d="M8,1a7,7,0,1,0,7,7A7,7,0,0,0,8,1ZM8,14a6,6,0,1,1,6-6A6,6,0,0,1,8,14Z"></path>
                <polygon points="11.15 4.15 8 7.29 4.85 4.15 4.15 4.85 7.29 8 4.15 11.15 4.85 11.85 8 8.71 11.15 11.85 11.85 11.15 8.71 8 11.85 4.85 11.15 4.15"></polygon>
            </g>
            <g id="ic-ellipsis">
                <circle cx="2" cy="8" r="1"></circle>
                <circle cx="8" cy="8" r="1"></circle>
                <circle cx="14" cy="8" r="1"></circle>
            </g>
        </svg>
        <div id="proton-editor-container">
            <div id=${ROOSTER_EDITOR_WRAPPER_ID}>
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
            iframeRef,
            mailSettings,
            onPasteImage,
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

        const onEditorClick = () => {
            editorRef.current?.focus();
            onFocus?.();
        };

        void initRooster()
            .then((editorInstance) => {
                editorRef.current = editorInstance;
            })
            .then(() => {
                const editorWrapper = iframeRef.current?.contentDocument?.getElementById(ROOSTER_EDITOR_WRAPPER_ID);
                editorWrapper?.addEventListener('click', onEditorClick);
            });

        return () => {
            editorRef.current?.dispose();

            const editorWrapper = iframeRef.current?.contentDocument?.getElementById(ROOSTER_EDITOR_WRAPPER_ID);
            editorWrapper?.removeEventListener('click', onEditorClick);
        };
    }, []);
};

export default useInitRooster;
