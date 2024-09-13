import { useRef } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import DropzoneContent from '@proton/components/components/dropzone/DropzoneContent';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { DropzoneContentProps } from '../../dropzone/DropzoneContent';
import { EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID, EDITOR_DROPZONE } from '../constants';
import type { ModalLinkProps } from '../hooks/interface';
import type { EditorActions, SetEditorToolbarConfig } from '../interface';
import BlockquoteToggle from './BlockquoteToggle';
import useBubbleIframeEvents from './hooks/useBubbleIframeEvents';
import useComposerDrag from './hooks/useComposerDrag';
import useInitRooster from './hooks/useInitRooster';
import useOnEditorChange from './hooks/useOnEditorChange';

import './RoosterEditor.scss';

interface Props {
    onChange?: (value: string) => void;
    onMouseUp?: () => void;
    onKeyUp?: () => void;
    showBlockquoteToggle?: boolean;
    onBlockquoteToggleClick?: () => void;
    onReady: (editorActions: EditorActions) => void;
    setToolbarConfig: SetEditorToolbarConfig;
    onPasteImage: (image: File) => void;
    mailSettings?: MailSettings;
    showModalLink: (props: ModalLinkProps) => void;
    onFocus?: () => void;
    className?: string;
    openEmojiPicker: () => void;
    dropzone?: DropzoneContentProps;
    onAddAttachments?: (files: File[]) => void;
}

const RoosterEditor = ({
    onChange,
    onMouseUp,
    onKeyUp,
    onReady,
    showBlockquoteToggle,
    onBlockquoteToggleClick,
    setToolbarConfig,
    onPasteImage,
    showModalLink,
    onFocus,
    mailSettings,
    className,
    openEmojiPicker,
    dropzone,
    onAddAttachments,
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const onEditorChangeCallback = useOnEditorChange({
        setToolbarConfig,
        onChange,
        onMouseUp,
        onKeyUp,
    });

    useInitRooster({
        iframeRef,
        initialContent: '',
        onReady,
        onEditorChange: onEditorChangeCallback,
        showModalLink,
        onFocus,
        mailSettings,
        onPasteImage,
        openEmojiPicker,
    });

    useBubbleIframeEvents(iframeRef);
    const isDragging = useComposerDrag(iframeRef, onAddAttachments);

    const blockquoteContainer = iframeRef.current?.contentDocument?.getElementById(
        EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID
    );
    const dropzoneContainer =
        dropzone && isDragging ? iframeRef.current?.contentDocument?.getElementById(EDITOR_DROPZONE) : undefined;

    return (
        <>
            <div
                className={clsx([
                    'editor-wrapper fill w-full h-full overflow-auto flex-1 flex flex-column relative',
                    className,
                ])}
            >
                <iframe
                    ref={iframeRef}
                    title={c('Title').t`Email composer`}
                    frameBorder="0"
                    className="w-full h-full flex-1"
                    data-testid="rooster-iframe"
                />
            </div>

            {blockquoteContainer &&
                createPortal(
                    <BlockquoteToggle show={showBlockquoteToggle} onClick={onBlockquoteToggleClick} />,
                    blockquoteContainer
                )}

            {dropzoneContainer ? createPortal(<DropzoneContent {...dropzone} embedded />, dropzoneContainer) : null}
        </>
    );
};

export default RoosterEditor;
