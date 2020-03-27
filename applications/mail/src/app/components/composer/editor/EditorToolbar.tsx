import React, { MutableRefObject, useEffect, useState } from 'react';
import { useModals, Icon } from 'react-components';

import EditorImageModal from './EditorImageModal';
import EditorLinkModal from './EditorLinkModal';
import { SquireType, LinkData } from '../../../helpers/squire/squireConfig';
import {
    toggleBold,
    toggleItalic,
    makeLink,
    insertImage,
    getLinkAtCursor,
    toggleUnderline,
    toggleOrderedList,
    toggleUnorderedList,
    toggleBlockquote,
    listenToCursor,
    getPathInfo
} from '../../../helpers/squire/squireActions';
import EditorToolbarButton from './EditorToolbarButton';
import EditorToolbarSeparator from './EditorToolbarSeparator';
import EditorToolbarFontFaceDropdown from './EditorToolbarFontFaceDropdown';
import EditorToolbarFontSizeDropdown from './EditorToolbarFontSizeDropdown';
import EditorToolbarFontColorsDropdown from './EditorToolbarFontColorsDropdown';
import EditorToolbarAlignmentDropdown from './EditorToolbarAlignmentDropdown';
import EditorToolbarMoreDropdown from './EditorToolbarMoreDropdown';
import { MessageExtended } from '../../../models/message';
import { isPlainText as testIsPlainText } from '../../../helpers/message/messages';
import { useHandler } from '../../../hooks/useHandler';

interface Props {
    message: MessageExtended;
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    onChange: (message: Partial<MessageExtended>) => void;
    onChangeFlag: (changes: Map<number, boolean>) => void;
    onAddAttachments: (files: File[]) => void;
}

const EditorToolbar = ({ message, squireRef, editorReady, onChange, onChangeFlag, onAddAttachments }: Props) => {
    const [squireInfos, setSquireInfos] = useState<{ [test: string]: boolean }>({});

    const { createModal } = useModals();

    const isPlainText = testIsPlainText(message.data);

    const handleCursor = useHandler(() => setSquireInfos(getPathInfo(squireRef.current)), { debounce: 500 });

    useEffect(() => listenToCursor(squireRef.current, handleCursor), [editorReady]);

    const handleBold = () => toggleBold(squireRef.current);
    const handleItalic = () => toggleItalic(squireRef.current);
    const handleUnderline = () => toggleUnderline(squireRef.current);
    const handleOrderedList = () => toggleOrderedList(squireRef.current);
    const handleUnorderedList = () => toggleUnorderedList(squireRef.current);
    const handleBlockquote = () => toggleBlockquote(squireRef.current);

    const handleAddLink = (link: LinkData) => {
        makeLink(squireRef.current, link);
    };

    const handleAddImageUrl = (url: string) => {
        insertImage(squireRef.current, url);
    };

    const handleLink = () => {
        const link = getLinkAtCursor(squireRef.current);
        createModal(<EditorLinkModal inputLink={link} onSubmit={handleAddLink} />);
    };

    const handleImage = () => {
        createModal(<EditorImageModal onAddUrl={handleAddImageUrl} onAddAttachments={onAddAttachments} />);
    };

    const handleClearFormatting = () => {
        squireRef.current.removeAllFormatting();
    };

    return (
        <div className="editor-toolbar flex ">
            {isPlainText ? (
                <div className="flex-item-fluid" />
            ) : (
                <>
                    <EditorToolbarFontFaceDropdown squireRef={squireRef} editorReady={editorReady} />
                    <EditorToolbarSeparator />
                    <EditorToolbarFontSizeDropdown squireRef={squireRef} editorReady={editorReady} />
                    <EditorToolbarSeparator />
                    <EditorToolbarFontColorsDropdown squireRef={squireRef} editorReady={editorReady} />
                    <EditorToolbarSeparator />
                    <EditorToolbarButton onClick={handleBold} aria-pressed={squireInfos.bold}>
                        <Icon name="text-bold" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton onClick={handleItalic} aria-pressed={squireInfos.italic}>
                        <Icon name="text-italic" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton onClick={handleUnderline} aria-pressed={squireInfos.underline}>
                        <Icon name="text-underline" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarSeparator />
                    <EditorToolbarAlignmentDropdown squireRef={squireRef} pathInfos={squireInfos} />
                    <EditorToolbarSeparator />
                    <EditorToolbarButton onClick={handleUnorderedList} aria-pressed={squireInfos.unorderedList}>
                        <Icon name="bullet-points" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton onClick={handleOrderedList} aria-pressed={squireInfos.orderedList}>
                        <Icon name="ordered-list" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarSeparator />
                    <EditorToolbarButton onClick={handleBlockquote} aria-pressed={squireInfos.blockquote}>
                        <Icon name="text-quote" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarSeparator />
                    <EditorToolbarButton onClick={handleLink}>
                        <Icon name="link" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton onClick={handleImage}>
                        <Icon name="file-image" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton onClick={handleClearFormatting}>
                        <Icon name="remove-text-formatting" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarSeparator />
                </>
            )}
            <EditorToolbarMoreDropdown
                message={message}
                squireRef={squireRef}
                onChange={onChange}
                onChangeFlag={onChangeFlag}
            />
        </div>
    );
};

export default EditorToolbar;
