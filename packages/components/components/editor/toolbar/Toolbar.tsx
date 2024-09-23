import type { Ref } from 'react';
import { Suspense, lazy } from 'react';

import { c } from 'ttag';

import { Vr } from '@proton/atoms';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import { ErrorBoundary } from '@proton/components/containers';
import { COMPOSER_TOOLBAR_ICON_SIZE } from '@proton/shared/lib/constants';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useActiveBreakpoint } from '../../../hooks';
import Icon from '../../icon/Icon';
import { DEFAULT_FONT_FACE_ID, DEFAULT_FONT_SIZE } from '../constants';
import type { ToolbarConfig } from '../helpers/getToolbarConfig';
import type { EditorMetadata } from '../interface';
import ToolbarAlignmentDropdown from './ToolbarAlignmentDropdown';
import ToolbarButton from './ToolbarButton';
import ToolbarColorsDropdown from './ToolbarColorsDropdown';
import ToolbarFontFaceDropdown from './ToolbarFontFaceDropdown';
import ToolbarFontSizeDropdown from './ToolbarFontSizeDropdown';
import ToolbarMoreDropdown from './ToolbarMoreDropdown';

const ToolbarEmojiDropdown = lazy(
    () => import(/* webpackChunkName: "ToolbarEmojiDropdown", webpackPreload: true */ './ToolbarEmojiDropdown')
);

interface ToolbarProps {
    config: ToolbarConfig | undefined;
    metadata: EditorMetadata;
    mailSettings?: MailSettings;
    userSettings?: UserSettings;
    className?: string;
    openEmojiPickerRef: Ref<() => void>;
    simple?: boolean;
    isSmallViewportForToolbar?: boolean;
}

const Toolbar = ({
    config,
    metadata,
    mailSettings,
    openEmojiPickerRef,
    className,
    simple,
    isSmallViewportForToolbar,
    userSettings,
}: ToolbarProps) => {
    const { viewportWidth } = useActiveBreakpoint();

    const smallViewport = isSmallViewportForToolbar ?? viewportWidth['<=small'];

    const showMoreDropdown = metadata.supportRightToLeft || metadata.supportPlainText || smallViewport;

    if (metadata.isPlainText) {
        return null;
    }

    if (!config) {
        return null;
    }

    return (
        <ButtonGroup className={clsx(['editor-toolbar overflow-hidden mb-2', className])}>
            <ToolbarFontFaceDropdown
                value={config.fontFace.value}
                setValue={config.fontFace.setValue}
                onClickDefault={config.defaultFont.showModal}
                defaultValue={mailSettings?.FontFace || DEFAULT_FONT_FACE_ID}
                showDefaultFontSelector={metadata.supportDefaultFontSelector}
            />
            <ToolbarFontSizeDropdown
                value={config.fontSize.value}
                setValue={config.fontSize.setValue}
                onClickDefault={config.defaultFont.showModal}
                defaultValue={`${mailSettings?.FontSize || DEFAULT_FONT_SIZE}px`}
                showDefaultFontSelector={metadata.supportDefaultFontSelector}
            />
            <ToolbarColorsDropdown
                fontColor={config.fontColor.value}
                setFontColor={config.fontColor.setValue}
                bgColor={config.backgroundColor.value}
                setBgColor={config.backgroundColor.setValue}
            />
            <>
                <ToolbarButton
                    onClick={config.bold.toggle}
                    aria-pressed={config.bold.isActive}
                    className={clsx(['shrink-0', config.bold.isActive && 'is-active'])}
                    title={c('Action').t`Bold`}
                    data-testid="editor-bold"
                >
                    <Icon
                        name="text-bold"
                        size={COMPOSER_TOOLBAR_ICON_SIZE}
                        className="m-auto"
                        alt={c('Action').t`Bold`}
                    />
                </ToolbarButton>
                <ToolbarButton
                    onClick={config.italic.toggle}
                    aria-pressed={config.italic.isActive}
                    className={clsx(['shrink-0', config.italic.isActive && 'is-active'])}
                    title={c('Action').t`Italic`}
                    data-testid="editor-italic"
                >
                    <Icon
                        name="text-italic"
                        size={COMPOSER_TOOLBAR_ICON_SIZE}
                        className="m-auto"
                        alt={c('Action').t`Italic`}
                    />
                </ToolbarButton>
                <ToolbarButton
                    onClick={config.underline.toggle}
                    aria-pressed={config.underline.isActive}
                    className={clsx(['shrink-0', config.underline.isActive && 'is-active'])}
                    title={c('Action').t`Underline`}
                    data-testid="editor-underline"
                >
                    <Icon
                        name="text-underline"
                        size={COMPOSER_TOOLBAR_ICON_SIZE}
                        className="m-auto"
                        alt={c('Action').t`Underline`}
                    />
                </ToolbarButton>
                <ToolbarButton
                    onClick={config.strikethrough.toggle}
                    aria-pressed={config.strikethrough.isActive}
                    className={clsx(['shrink-0', config.strikethrough.isActive && 'is-active'])}
                    title={c('Action').t`Strikethrough`}
                    data-testid="editor-strikethrough"
                >
                    <Icon
                        name="text-strikethrough"
                        size={COMPOSER_TOOLBAR_ICON_SIZE}
                        className="m-auto"
                        alt={c('Action').t`Strikethrough`}
                    />
                </ToolbarButton>
            </>
            {!smallViewport ? (
                <>
                    <ToolbarButton
                        onClick={config.unorderedList.toggle}
                        aria-pressed={config.unorderedList.isActive}
                        className={clsx(['shrink-0', config.unorderedList.isActive && 'is-active'])}
                        title={c('Action').t`Unordered list`}
                        data-testid="editor-unordered-list"
                    >
                        <Icon
                            name="list-bullets"
                            size={COMPOSER_TOOLBAR_ICON_SIZE}
                            className="m-auto rtl:mirror"
                            alt={c('Action').t`Unordered list`}
                        />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={config.orderedList.toggle}
                        aria-pressed={config.orderedList.isActive}
                        className={clsx(['shrink-0', config.orderedList.isActive && 'is-active'])}
                        title={c('Action').t`Ordered list`}
                        data-testid="editor-ordered-list"
                    >
                        <Icon
                            name="list-numbers"
                            size={COMPOSER_TOOLBAR_ICON_SIZE}
                            className="m-auto rtl:mirror"
                            alt={c('Action').t`Ordered list`}
                        />
                    </ToolbarButton>
                    <Vr aria-hidden="true" />
                    <ToolbarAlignmentDropdown setAlignment={config.alignment.setValue} />
                    {!simple && (
                        <>
                            <Vr aria-hidden="true" />{' '}
                            <ErrorBoundary component={null}>
                                <Suspense fallback={null}>
                                    <ToolbarEmojiDropdown
                                        onInsert={config.emoji.insert}
                                        openRef={openEmojiPickerRef}
                                        userSettings={userSettings}
                                    />
                                </Suspense>
                            </ErrorBoundary>
                        </>
                    )}
                    <ToolbarButton
                        onClick={config.blockquote.toggle}
                        aria-pressed={config.blockquote.isActive}
                        className={clsx(['shrink-0', config.blockquote.isActive && 'is-active'])}
                        title={c('Action').t`Quote`}
                        data-testid="editor-quote"
                    >
                        <Icon
                            name="text-quote"
                            size={COMPOSER_TOOLBAR_ICON_SIZE}
                            className="m-auto"
                            alt={c('Action').t`Quote`}
                        />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={config.link.showModal}
                        className="shrink-0"
                        title={c('Action').t`Insert link`}
                        data-testid="editor-insert-link"
                    >
                        <Icon
                            name="link"
                            size={COMPOSER_TOOLBAR_ICON_SIZE}
                            className="m-auto"
                            alt={c('Action').t`Insert link`}
                        />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={config.formatting.clear}
                        className="shrink-0"
                        title={c('Action').t`Clear all formatting`}
                        data-testid="editor-clear-formatting"
                    >
                        <Icon
                            name="eraser"
                            size={COMPOSER_TOOLBAR_ICON_SIZE}
                            className="m-auto"
                            alt={c('Action').t`Clear all formatting`}
                        />
                    </ToolbarButton>
                    {simple && metadata.supportImages && (
                        <>
                            <Vr aria-hidden="true" />
                            <ToolbarButton
                                onClick={config.image.showModal}
                                className="shrink-0"
                                title={c('Action').t`Insert image`}
                            >
                                <Icon
                                    name="file-image"
                                    size={COMPOSER_TOOLBAR_ICON_SIZE}
                                    className="m-auto"
                                    alt={c('Action').t`Insert image`}
                                />
                            </ToolbarButton>
                        </>
                    )}
                </>
            ) : null}
            {showMoreDropdown && <ToolbarMoreDropdown config={config} metadata={metadata} isNarrow={smallViewport} />}
        </ButtonGroup>
    );
};

export default Toolbar;
