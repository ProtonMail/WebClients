import React, { MutableRefObject, useEffect, useState } from 'react';
import { useModals, Icon } from 'react-components';
import { c } from 'ttag';

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
import { MessageChange } from '../Composer';
import { Breakpoints } from '../../../models/utils';

interface Props {
    message: MessageExtended;
    breakpoints: Breakpoints;
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    onChange: MessageChange;
    onChangeFlag: (changes: Map<number, boolean>) => void;
    onAddAttachments: (files: File[]) => void;
}

const EditorToolbar = ({
    message,
    breakpoints,
    squireRef,
    editorReady,
    onChange,
    onChangeFlag,
    onAddAttachments
}: Props) => {
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

    const { isNarrow } = breakpoints;

    return (
        <div className="editor-toolbar flex flex-nowrap">
            {isPlainText ? (
                <div className="flex-item-fluid" />
            ) : (
                <>
                    {!isNarrow && (
                        <>
                            <EditorToolbarFontFaceDropdown
                                squireRef={squireRef}
                                editorReady={editorReady}
                                title={c('Action').t`Font face`}
                            />
                            <EditorToolbarSeparator />
                            <EditorToolbarFontSizeDropdown
                                squireRef={squireRef}
                                editorReady={editorReady}
                                className="flex-item-noshrink"
                                title={c('Action').t`Size`}
                            />
                            <EditorToolbarSeparator />
                            <EditorToolbarFontColorsDropdown
                                squireRef={squireRef}
                                editorReady={editorReady}
                                className="flex-item-noshrink"
                                title={c('Action').t`Color`}
                            />
                            <EditorToolbarSeparator />
                        </>
                    )}
                    <EditorToolbarButton
                        onClick={handleBold}
                        aria-pressed={squireInfos.bold}
                        className="flex-item-noshrink"
                        title={c('Action').t`Bold`}
                    >
                        <Icon name="text-bold" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton
                        onClick={handleItalic}
                        aria-pressed={squireInfos.italic}
                        className="flex-item-noshrink"
                        title={c('Action').t`Italic`}
                    >
                        <Icon name="text-italic" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton
                        onClick={handleUnderline}
                        aria-pressed={squireInfos.underline}
                        className="flex-item-noshrink"
                        title={c('Action').t`Underline`}
                    >
                        <Icon name="text-underline" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarSeparator />
                    <EditorToolbarAlignmentDropdown
                        squireRef={squireRef}
                        pathInfos={squireInfos}
                        className="flex-item-noshrink"
                        title={c('Action').t`Alignment`}
                    />
                    <EditorToolbarSeparator />
                    <EditorToolbarButton
                        onClick={handleUnorderedList}
                        aria-pressed={squireInfos.unorderedList}
                        className="flex-item-noshrink"
                        title={c('Action').t`Unordered list`}
                    >
                        <Icon name="bullet-points" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton
                        onClick={handleOrderedList}
                        aria-pressed={squireInfos.orderedList}
                        className="flex-item-noshrink"
                        title={c('Action').t`Ordered list`}
                    >
                        <Icon name="ordered-list" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarSeparator />
                    {!isNarrow && (
                        <>
                            <EditorToolbarButton
                                onClick={handleBlockquote}
                                aria-pressed={squireInfos.blockquote}
                                className="flex-item-noshrink"
                                title={c('Action').t`Quote`}
                            >
                                <Icon name="text-quote" className="mauto" />
                            </EditorToolbarButton>
                            <EditorToolbarSeparator />
                        </>
                    )}
                    <EditorToolbarButton
                        onClick={handleLink}
                        className="flex-item-noshrink"
                        title={c('Action').t`Insert link`}
                    >
                        <Icon name="link" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton
                        onClick={handleImage}
                        className="flex-item-noshrink"
                        title={c('Action').t`Insert image`}
                    >
                        <Icon name="file-image" className="mauto" />
                    </EditorToolbarButton>
                    <EditorToolbarButton
                        onClick={handleClearFormatting}
                        className="flex-item-noshrink"
                        title={c('Action').t`Clear all formatting`}
                    >
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
                title={c('Action').t`More`}
            />
        </div>
    );
};

export default EditorToolbar;
