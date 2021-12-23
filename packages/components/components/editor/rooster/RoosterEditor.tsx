import { useRef } from 'react';
import { c } from 'ttag';
import { createPortal } from 'react-dom';
import { BeforePasteEvent } from 'roosterjs-editor-types';

import { classnames } from '../../../helpers';

import useInitRooster from './hooks/useInitRooster';
import useBubbleIframeEvents from './hooks/useBubbleIframeEvents';

import { EditorActions, SetEditorToolbarConfig } from '../interface';
import { EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID } from '../constants';
import BlockquoteToggle from './BlockquoteToggle';

import './RoosterEditor.scss';
import useOnEditorChange from './hooks/useOnEditorChange';
import { MailSettings } from '@proton/shared/lib/interfaces';

interface Props {
    placeholder?: string;
    onChange?: (value: string) => void;
    showBlockquoteToggle?: boolean;
    onBlockquoteToggleClick?: () => void;
    disabled?: boolean;
    onReady: (editorActions: EditorActions) => void;
    setToolbarConfig: SetEditorToolbarConfig;
    onBeforePaste?: (event: BeforePasteEvent) => void;
    mailSettings?: MailSettings;
}

const RoosterEditor = ({
    placeholder,
    onChange,
    disabled = false,
    onReady,
    showBlockquoteToggle,
    onBlockquoteToggleClick,
    setToolbarConfig,
    onBeforePaste,
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const onEditorChangeCallback = useOnEditorChange({
        placeholder,
        setToolbarConfig,
        onChange,
        onBeforePaste,
    });

    useInitRooster({
        iframeRef,
        initialContent: placeholder,
        onReady,
        onEditorChange: onEditorChangeCallback,
    });

    useBubbleIframeEvents(iframeRef);

    const blockquoteContainer = iframeRef.current?.contentDocument?.getElementById(
        EDITOR_BLOCKQUOTE_TOGGLE_CONTAINER_ID
    );

    return (
        <>
            <div className={classnames(['w100 h100 flex-item-fluid relative', disabled && 'editor--disabled'])}>
                <div className="editor-wrapper fill w100 h100 scroll-if-needed flex-item-fluid relative">
                    <iframe
                        ref={iframeRef}
                        title={c('Title').t`Email composer`}
                        frameBorder="0"
                        className="w100 h100"
                        data-testid="rooster-iframe"
                    />
                </div>
            </div>
            {blockquoteContainer &&
                createPortal(
                    <BlockquoteToggle show={showBlockquoteToggle} onClick={onBlockquoteToggleClick} />,
                    blockquoteContainer
                )}
        </>
    );
};

export default RoosterEditor;
