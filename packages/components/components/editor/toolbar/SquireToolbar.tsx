import {
    MutableRefObject,
    useEffect,
    useState,
    ReactNode,
    useMemo,
    useCallback,
    memo,
} from 'react';
import { c } from 'ttag';
import { classnames } from '../../../helpers';
import { useHandler, useIsMounted, useModals } from '../../../hooks';
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
    const isMounted = useIsMounted();
    const [squireInfos, setSquireInfos] = useState<{ [test: string]: boolean }>({});

    const { createModal } = useModals();

    const handleCursor = useHandler(() => {
        if (isMounted()) {
            setSquireInfos(getPathInfo(squireRef.current));
        }
    });
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
        squireRef.current?.fireEvent('input'); // For Squire to be aware of the change
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
                        className={classnames(['flex-item-noshrink', squireInfos.bold && 'is-active'])}
                        title={c('Action').t`Bold`}
                        tabIndex={-1}
                    >
                        <Icon name="bold" className="mauto" alt={c('Action').t`Bold`} />
                    </SquireToolbarButton>
                    <SquireToolbarButton
                        onClick={handleItalic}
                        aria-pressed={squireInfos.italic}
                        className={classnames(['flex-item-noshrink', squireInfos.italic && 'is-active'])}
                        title={c('Action').t`Italic`}
                        tabIndex={-1}
                    >
                        <Icon name="italic" className="mauto" alt={c('Action').t`Italic`} />
                    </SquireToolbarButton>
                    <SquireToolbarButton
                        onClick={handleUnderline}
                        aria-pressed={squireInfos.underline}
                        className={classnames(['flex-item-noshrink', squireInfos.underline && 'is-active'])}
                        title={c('Action').t`Underline`}
                        tabIndex={-1}
                    >
                        <Icon name="underline" className="mauto" alt={c('Action').t`Underline`} />
                    </SquireToolbarButton>
                    <SquireToolbarSeparator />
                    {!isNarrow && (
                        <>
                            <SquireToolbarButton
                                onClick={handleUnorderedList}
                                aria-pressed={squireInfos.unorderedList}
                                className={classnames(['flex-item-noshrink', squireInfos.unorderedList && 'is-active'])}
                                title={c('Action').t`Unordered list`}
                                tabIndex={-1}
                            >
                                <Icon name="list" className="mauto" alt={c('Action').t`Unordered list`} />
                            </SquireToolbarButton>
                            <SquireToolbarButton
                                onClick={handleOrderedList}
                                aria-pressed={squireInfos.orderedList}
                                className={classnames(['flex-item-noshrink', squireInfos.orderedList && 'is-active'])}
                                title={c('Action').t`Ordered list`}
                                tabIndex={-1}
                            >
                                <Icon name="list-numbers" className="mauto" alt={c('Action').t`Ordered list`} />
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
                                className={classnames(['flex-item-noshrink', squireInfos.blockquote && 'is-active'])}
                                title={c('Action').t`Quote`}
                                tabIndex={-1}
                            >
                                <Icon name="quote-right" className="mauto" alt={c('Action').t`Quote`} />
                            </SquireToolbarButton>
                            <SquireToolbarButton
                                onClick={handleLink}
                                className="flex-item-noshrink"
                                title={c('Action').t`Insert link`}
                                tabIndex={-1}
                            >
                                <Icon name="link" className="mauto" alt={c('Action').t`Insert link`} />
                            </SquireToolbarButton>
                            <SquireToolbarButton
                                onClick={handleClearFormatting}
                                className="flex-item-noshrink"
                                title={c('Action').t`Clear all formatting`}
                                tabIndex={-1}
                            >
                                <Icon name="eraser" className="mauto" alt={c('Action').t`Clear all formatting`} />
                            </SquireToolbarButton>
                            <SquireToolbarSeparator />
                            {metadata.supportImages && (
                                <>
                                    <SquireToolbarButton
                                        onClick={handleImage}
                                        className="flex-item-noshrink"
                                        title={c('Action').t`Insert image`}
                                        tabIndex={-1}
                                    >
                                        <Icon name="file-image" className="mauto" alt={c('Action').t`Insert image`} />
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
