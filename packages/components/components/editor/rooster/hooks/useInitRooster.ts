import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import type { IEditor } from 'roosterjs-editor-types';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useSyncIframeStyles from '@proton/components/containers/themes/useSyncIframeStyles';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { MailSettings } from '@proton/shared/lib/interfaces';

import {
    EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID,
    EDITOR_DROPZONE,
    ROOSTER_EDITOR_ID,
    ROOSTER_EDITOR_WRAPPER_ID,
} from '../../constants';
import type { ModalLinkProps } from '../../hooks/interface';
import type { EditorActions, OnEditorEventListened } from '../../interface';
import { initRoosterEditor } from '../helpers/initRoosterEditor';

import iframeCss from '../RoosterEditorIframe.raw.scss';

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
    openEmojiPicker: () => void;
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
    openEmojiPicker,
}: Props) => {
    const editorRef = useRef<IEditor>();
    const isMounted = useIsMounted();
    const theme = useTheme();
    const themeCSSVariables = theme.information.style;

    useSyncIframeStyles(iframeRef.current?.contentWindow?.document.documentElement, document.documentElement);

    const initRooster = useCallback(async () => {
        const iframe = iframeRef.current as HTMLIFrameElement;
        const iframeDocument = iframe.contentWindow?.document as Document;

        /**
         * Disable Dark Reader on the composer iframe to avoid sending censored emails
         * https://github.com/darkreader/darkreader/blob/main/CONTRIBUTING.md#disabling-dark-reader-on-your-site
         */
        const disableDarkReaderMeta = '<meta name="darkreader-lock">';

        iframeDocument.open();
        iframeDocument.write(`
        <head>
            ${disableDarkReaderMeta}
            <style>
                ${iframeCss}
                ${themeCSSVariables}
                .proton-embedded:not([src]){
                    background: url('/assets/img/icons/broken-img.png') no-repeat 0 50% white;
                }
                .proton-embedded[alt]:not([src])::after {
                    background: url('/assets/img/icons/broken-img.png') no-repeat 0 50% white;
                }
            </style>
        </head>
        <body>
        <svg class='proton-hidden'>
            <g id='ic-file-shapes'>
                <path fill-rule='evenodd' d='M13 13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h5v2.5A1.5 1.5 0 0 0 10.5 6H13v7Zm-.414-8L10 2.414V4.5a.5.5 0 0 0 .5.5h2.086ZM2 3a2 2 0 0 1 2-2h5.172a2 2 0 0 1 1.414.586l2.828 2.828A2 2 0 0 1 14 5.828V13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3Zm3 8v1h1v-1H5Zm-.5-1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-2Z'/>
                <path fill-rule='evenodd' d='M9.5 9a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'/>
            </g>
            <g id='ic-cross-circle'>
                <path fill-rule='evenodd' d='M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Zm0 1A7 7 0 1 0 8 1a7 7 0 0 0 0 14Z'/>
                <path fill-rule='evenodd' d='M5.146 5.146a.5.5 0 0 1 .708 0L8 7.293l2.146-2.147a.5.5 0 0 1 .708.708L8.707 8l2.147 2.146a.5.5 0 0 1-.708.708L8 8.707l-2.146 2.147a.5.5 0 0 1-.708-.708L7.293 8 5.146 5.854a.5.5 0 0 1 0-.708Z'/>
            </g>
            <g id='ic-three-dots-horizontal'>
              <path d='M4 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z'/>
              <path d='M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z'/>
              <path d='M14 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z'/>
            </g>
        </svg>
        <div id='proton-editor-container'>
            <div id='${ROOSTER_EDITOR_WRAPPER_ID}'>
                <div id='${ROOSTER_EDITOR_ID}' ></div>
                <div id='${EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID}' ></div>
            </div>
        </div>
        <div id='${EDITOR_DROPZONE}' />
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
            openEmojiPicker,
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
