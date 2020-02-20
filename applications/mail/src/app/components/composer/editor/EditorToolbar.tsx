import React, { MutableRefObject } from 'react';
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
    toggleBlockquote
} from '../../../helpers/squire/squireActions';
import EditorToolbarButton from './EditorToolbarButton';
import EditorToolbarSeparator from './EditorToolbarSeparator';
import EditorToolbarFontFaceDropdown from './EditorToolbarFontFaceDropdown';
import EditorToolbarFontSizeDropdown from './EditorToolbarFontSizeDropdown';
import EditorToolbarFontColorsDropdown from './EditorToolbarFontColorsDropdown';
import EditorToolbarAlignmentDropdown from './EditorToolbarAlignmentDropdown';
import EditorToolbarMoreDropdown from './EditorToolbarMoreDropdown copy';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    onAddAttachments: (files: File[]) => void;
}

const EditorToolbar = ({ squireRef, editorReady, onAddAttachments }: Props) => {
    const { createModal } = useModals();

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
        <div className="editor-toolbar flex">
            <EditorToolbarFontFaceDropdown squireRef={squireRef} editorReady={editorReady} />
            <EditorToolbarSeparator />
            <EditorToolbarFontSizeDropdown squireRef={squireRef} editorReady={editorReady} />
            <EditorToolbarSeparator />
            <EditorToolbarFontColorsDropdown squireRef={squireRef} editorReady={editorReady} />
            <EditorToolbarSeparator />
            <EditorToolbarButton onClick={handleBold}>
                <Icon name="text-bold" />
            </EditorToolbarButton>
            <EditorToolbarButton onClick={handleItalic}>
                <Icon name="text-italic" />
            </EditorToolbarButton>
            <EditorToolbarButton onClick={handleUnderline}>
                <Icon name="text-underline" />
            </EditorToolbarButton>
            <EditorToolbarSeparator />
            <EditorToolbarAlignmentDropdown squireRef={squireRef} />
            <EditorToolbarSeparator />
            <EditorToolbarButton onClick={handleUnorderedList}>
                <Icon name="bullet-points" />
            </EditorToolbarButton>
            <EditorToolbarButton onClick={handleOrderedList}>
                <Icon name="ordered-list" />
            </EditorToolbarButton>
            <EditorToolbarSeparator />
            <EditorToolbarButton onClick={handleBlockquote}>
                <Icon name="text-quote" />
            </EditorToolbarButton>
            <EditorToolbarSeparator />
            <EditorToolbarButton onClick={handleLink}>
                <Icon name="link" />
            </EditorToolbarButton>
            <EditorToolbarButton onClick={handleImage}>
                <Icon name="file-image" />
            </EditorToolbarButton>
            <EditorToolbarButton onClick={handleClearFormatting}>
                <Icon name="remove-text-formatting" />
            </EditorToolbarButton>
            <EditorToolbarSeparator />
            <EditorToolbarMoreDropdown />
        </div>
    );
};

export default EditorToolbar;
