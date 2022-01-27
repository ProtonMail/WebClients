import { c } from 'ttag';
import { classnames } from '../../../helpers';
import Icon from '../../icon/Icon';
import { ButtonGroup, Button } from '../../button';
import { Vr } from '../../vr';
import { useActiveBreakpoint } from '../../../hooks';

import { ToolbarConfig } from '../helpers/getToolbarConfig';
import ToolbarButton from './ToolbarButton';

import ToolbarFontFaceDropdown from './ToolbarFontFaceDropdown';
import ToolbarFontSizeDropdown from './ToolbarFontSizeDropdown';
import ToolbarColorsDropdown from './ToolbarColorsDropdown';
import ToolbarAlignmentDropdown from './ToolbarAlignmentDropdown';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '../constants';
import { EditorMetadata } from '../interface';
import ToolbarMoreDropdown from './ToolbarMoreDropdown';
import { MailSettings } from '@proton/shared/lib/interfaces';

interface ShowProps {
    when: boolean;
    children: React.ReactNode;
}

const ToolbarSeparator = () => <Vr />;
const Show = ({ children, when }: ShowProps) => <>{when ? children : null}</>;

interface ToolbarProps {
    config: ToolbarConfig | undefined;
    metadata: EditorMetadata;
    onChangeMetadata: (metadata: Partial<EditorMetadata>) => void;
    mailSettings: MailSettings | undefined;
}

const Toolbar = ({ config, metadata, onChangeMetadata, mailSettings }: ToolbarProps) => {
    const { isNarrow } = useActiveBreakpoint();

    const showMoreDropdown = metadata.supportRightToLeft || metadata.supportPlainText || isNarrow;

    if (metadata.isPlainText) {
        return (
            <Button
                className="mlauto"
                onClick={() => onChangeMetadata({ isPlainText: false })}
                data-testid="editor-to-html"
            >{c('Action').t`Switch to rich text`}</Button>
        );
    }

    if (!config) {
        return null;
    }

    return (
        <ButtonGroup className="rounded-xl editor-toolbar">
            <>
                <ToolbarFontFaceDropdown
                    value={config.fontFace.value}
                    setValue={config.fontFace.setValue}
                    onClickDefault={config.defaultFont.showModal}
                    defaultValue={mailSettings?.FontFace || DEFAULT_FONT_FACE}
                    showDefaultFontSelector={metadata.supportDefaultFontSelector}
                />
                <ToolbarSeparator />
                <ToolbarFontSizeDropdown
                    value={config.fontSize.value}
                    setValue={config.fontSize.setValue}
                    onClickDefault={config.defaultFont.showModal}
                    defaultValue={`${mailSettings?.FontSize || DEFAULT_FONT_SIZE}px`}
                    showDefaultFontSelector={metadata.supportDefaultFontSelector}
                />
                <ToolbarSeparator />
                <ToolbarColorsDropdown
                    fontColor={config.fontColor.value}
                    setFontColor={config.fontColor.setValue}
                    bgColor={config.backgroundColor.value}
                    setBgColor={config.backgroundColor.setValue}
                />
                <ToolbarSeparator />
                <ToolbarButton
                    onClick={config.bold.toggle}
                    aria-pressed={config.bold.isActive}
                    className={classnames(['flex-item-noshrink', config.bold.isActive && 'is-active'])}
                    title={c('Action').t`Bold`}
                    tabIndex={-1}
                >
                    <Icon name="bold" className="mauto" alt={c('Action').t`Bold`} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={config.italic.toggle}
                    aria-pressed={config.italic.isActive}
                    className={classnames(['flex-item-noshrink', config.italic.isActive && 'is-active'])}
                    title={c('Action').t`Italic`}
                    tabIndex={-1}
                >
                    <Icon name="italic" className="mauto" alt={c('Action').t`Italic`} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={config.underline.toggle}
                    aria-pressed={config.underline.isActive}
                    className={classnames(['flex-item-noshrink', config.underline.isActive && 'is-active'])}
                    title={c('Action').t`Underline`}
                    tabIndex={-1}
                >
                    <Icon name="underline" className="mauto" alt={c('Action').t`Underline`} />
                </ToolbarButton>
                <Show when={!isNarrow}>
                    <ToolbarSeparator />
                    <ToolbarButton
                        onClick={config.unorderedList.toggle}
                        aria-pressed={config.unorderedList.isActive}
                        className={classnames(['flex-item-noshrink', config.unorderedList.isActive && 'is-active'])}
                        title={c('Action').t`Unordered list`}
                        tabIndex={-1}
                    >
                        <Icon name="list" className="mauto on-rtl-mirror" alt={c('Action').t`Unordered list`} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={config.orderedList.toggle}
                        aria-pressed={config.orderedList.isActive}
                        className={classnames(['flex-item-noshrink', config.orderedList.isActive && 'is-active'])}
                        title={c('Action').t`Ordered list`}
                        tabIndex={-1}
                    >
                        <Icon name="list-numbers" className="mauto on-rtl-mirror" alt={c('Action').t`Ordered list`} />
                    </ToolbarButton>
                    <ToolbarSeparator />
                    <ToolbarAlignmentDropdown setAlignment={config.alignment.setValue} />
                    <ToolbarSeparator />
                    <ToolbarButton
                        onClick={config.blockquote.toggle}
                        aria-pressed={config.blockquote.isActive}
                        className={classnames(['flex-item-noshrink', config.blockquote.isActive && 'is-active'])}
                        title={c('Action').t`Quote`}
                        tabIndex={-1}
                    >
                        <Icon name="quote-right" className="mauto" alt={c('Action').t`Quote`} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={config.link.showModal}
                        className="flex-item-noshrink"
                        title={c('Action').t`Insert link`}
                        tabIndex={-1}
                    >
                        <Icon name="link" className="mauto" alt={c('Action').t`Insert link`} />
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={config.formatting.clear}
                        className="flex-item-noshrink"
                        title={c('Action').t`Clear all formatting`}
                        tabIndex={-1}
                    >
                        <Icon name="eraser" className="mauto" alt={c('Action').t`Clear all formatting`} />
                    </ToolbarButton>
                    {metadata.supportImages && (
                        <>
                            <ToolbarSeparator />
                            <ToolbarButton
                                onClick={config.image.showModal}
                                className="flex-item-noshrink"
                                title={c('Action').t`Insert image`}
                                tabIndex={-1}
                            >
                                <Icon name="file-image" className="mauto" alt={c('Action').t`Insert image`} />
                            </ToolbarButton>
                        </>
                    )}
                </Show>
                {showMoreDropdown && (
                    <ToolbarMoreDropdown
                        config={config}
                        metadata={metadata}
                        onChangeMetadata={onChangeMetadata}
                        isNarrow={isNarrow}
                    />
                )}
            </>
        </ButtonGroup>
    );
};

export default Toolbar;
