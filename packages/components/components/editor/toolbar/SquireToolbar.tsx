import React, { MutableRefObject, useEffect, useState, ReactNode, useMemo, useCallback, memo } from 'react';
import { c } from 'ttag';

import { useHandler, useModals } from '../../../hooks';
import Icon from '../../icon/Icon';

import InsertImageModal from '../modals/InsertImageModal';
import InsertLinkModal from '../modals/InsertLinkModal';
import { SquireType, LinkData } from '../squireConfig';
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
    getPathInfo,
} from '../squireActions';
import SquireToolbarButton from './SquireToolbarButton';
import SquireToolbarSeparator from './SquireToolbarSeparator';
import SquireToolbarFontFaceDropdown from './SquireToolbarFontFaceDropdown';
import SquireToolbarFontSizeDropdown from './SquireToolbarFontSizeDropdown';
import SquireToolbarFontColorsDropdown from './SquireToolbarFontColorsDropdown';
import SquireToolbarAlignmentDropdown from './SquireToolbarAlignmentDropdown';
import SquireToolbarMoreDropdown from './SquireToolbarMoreDropdown';
import { ALIGNMENT, SquireEditorMetadata } from '../interface';

interface Props {
    metadata: SquireEditorMetadata;
    onChangeMetadata: (change: Partial<SquireEditorMetadata>) => void;
    isNarrow: boolean;
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    onAddImages: (files: File[]) => void;
    moreDropdownExtension: ReactNode;
}

const SquireToolbar = ({
    metadata,
    onChangeMetadata,
    isNarrow,
    squireRef,
    editorReady,
    onAddImages,
    moreDropdownExtension,
}: Props) => {
    const [squireInfos, setSquireInfos] = useState<{ [test: string]: boolean }>({});

    const { createModal } = useModals();

    const handleCursor = useHandler(() => setSquireInfos(getPathInfo(squireRef.current)));
    const handleCursorDebounced = useHandler(handleCursor, { debounce: 500 });

    const forceRefresh = (action: () => void) => () => {
        action();
        handleCursor();
    };

    useEffect(() => {
        const removeListener = listenToCursor(squireRef.current, handleCursorDebounced);

        return () => {
            handleCursorDebounced.abort?.();
            removeListener?.();
        };
    }, [editorReady]);

    const handleBold = useCallback(
        forceRefresh(() => toggleBold(squireRef.current)),
        []
    );
    const handleItalic = useCallback(
        forceRefresh(() => toggleItalic(squireRef.current)),
        []
    );
    const handleUnderline = useCallback(
        forceRefresh(() => toggleUnderline(squireRef.current)),
        []
    );

    const handleAlignment = useCallback(
        (alignment: ALIGNMENT) =>
            forceRefresh(() => {
                squireRef.current.setTextAlignment(alignment);
            }),
        []
    );

    const handleOrderedList = useCallback(
        forceRefresh(() => toggleOrderedList(squireRef.current)),
        []
    );

    const handleUnorderedList = useCallback(
        forceRefresh(() => toggleUnorderedList(squireRef.current)),
        []
    );
    const handleBlockquote = useCallback(
        forceRefresh(() => toggleBlockquote(squireRef.current)),
        []
    );

    const handleAddLink = useCallback((link: LinkData) => {
        makeLink(squireRef.current, link);
    }, []);

    const handleAddImageUrl = useCallback((url: string) => {
        insertImage(squireRef.current, url);
    }, []);

    const handleLink = useCallback(() => {
        const link = getLinkAtCursor(squireRef.current);
        createModal(<InsertLinkModal inputLink={link} onSubmit={handleAddLink} />);
    }, []);

    const handleImage = useCallback(() => {
        createModal(<InsertImageModal onAddUrl={handleAddImageUrl} onAddImages={onAddImages} />);
    }, []);

    const handleClearFormatting = useCallback(() => {
        squireRef.current.removeAllFormatting();
    }, []);

    const squireActions = useMemo(
        () => ({
            handleAlignment,
            handleUnorderedList,
            handleOrderedList,
            handleBlockquote,
            handleLink,
            handleClearFormatting,
            handleImage,
        }),
        [
            handleAlignment,
            handleUnorderedList,
            handleOrderedList,
            handleBlockquote,
            handleLink,
            handleClearFormatting,
            handleImage,
        ]
    );

    return (
        <div className="editor-toolbar flex flex-nowrap">
            {metadata.isPlainText ? (
                <div className="flex-item-fluid" />
            ) : (
                <>
                    <SquireToolbarFontFaceDropdown squireRef={squireRef} editorReady={editorReady} />
                    <SquireToolbarSeparator />
                    <SquireToolbarFontSizeDropdown squireRef={squireRef} editorReady={editorReady} />
                    <SquireToolbarSeparator />
                    <SquireToolbarFontColorsDropdown squireRef={squireRef} editorReady={editorReady} />
                    <SquireToolbarSeparator />
                    <SquireToolbarButton
                        onClick={handleBold}
                        aria-pressed={squireInfos.bold}
                        className="flex-item-noshrink"
                        title={c('Action').t`Bold`}
                    >
                        <Icon name="text-bold" className="mauto" />
                    </SquireToolbarButton>
                    <SquireToolbarButton
                        onClick={handleItalic}
                        aria-pressed={squireInfos.italic}
                        className="flex-item-noshrink"
                        title={c('Action').t`Italic`}
                    >
                        <Icon name="text-italic" className="mauto" />
                    </SquireToolbarButton>
                    <SquireToolbarButton
                        onClick={handleUnderline}
                        aria-pressed={squireInfos.underline}
                        className="flex-item-noshrink"
                        title={c('Action').t`Underline`}
                    >
                        <Icon name="text-underline" className="mauto" />
                    </SquireToolbarButton>
                    <SquireToolbarSeparator />
                    {!isNarrow && (
                        <>
                            <SquireToolbarButton
                                onClick={handleUnorderedList}
                                aria-pressed={squireInfos.unorderedList}
                                className="flex-item-noshrink"
                                title={c('Action').t`Unordered list`}
                            >
                                <Icon name="bullet-points" className="mauto" />
                            </SquireToolbarButton>
                            <SquireToolbarButton
                                onClick={handleOrderedList}
                                aria-pressed={squireInfos.orderedList}
                                className="flex-item-noshrink"
                                title={c('Action').t`Ordered list`}
                            >
                                <Icon name="ordered-list" className="mauto" />
                            </SquireToolbarButton>
                            <SquireToolbarSeparator />
                            <SquireToolbarAlignmentDropdown
                                handleAlignment={handleAlignment}
                                squireInfos={squireInfos}
                            />
                            <SquireToolbarSeparator />
                            <SquireToolbarButton
                                onClick={handleBlockquote}
                                aria-pressed={squireInfos.blockquote}
                                className="flex-item-noshrink"
                                title={c('Action').t`Quote`}
                            >
                                <Icon name="text-quote" className="mauto" />
                            </SquireToolbarButton>
                            <SquireToolbarButton
                                onClick={handleLink}
                                className="flex-item-noshrink"
                                title={c('Action').t`Insert link`}
                            >
                                <Icon name="link" className="mauto" />
                            </SquireToolbarButton>
                            <SquireToolbarButton
                                onClick={handleClearFormatting}
                                className="flex-item-noshrink"
                                title={c('Action').t`Clear all formatting`}
                            >
                                <Icon name="remove-text-formatting" className="mauto" />
                            </SquireToolbarButton>
                            <SquireToolbarSeparator />
                            {metadata.supportImages && (
                                <>
                                    <SquireToolbarButton
                                        onClick={handleImage}
                                        className="flex-item-noshrink"
                                        title={c('Action').t`Insert image`}
                                    >
                                        <Icon name="file-image" className="mauto" />
                                    </SquireToolbarButton>
                                    <SquireToolbarSeparator />
                                </>
                            )}
                        </>
                    )}
                </>
            )}
            {(metadata.supportRightToLeft || metadata.supportPlainText || moreDropdownExtension || isNarrow) && (
                <SquireToolbarMoreDropdown
                    metadata={metadata}
                    squireRef={squireRef}
                    onChangeMetadata={onChangeMetadata}
                    isNarrow={isNarrow}
                    squireInfos={squireInfos}
                    squireActions={squireActions}
                >
                    {moreDropdownExtension}
                </SquireToolbarMoreDropdown>
            )}
        </div>
    );
};

export default memo(SquireToolbar);
