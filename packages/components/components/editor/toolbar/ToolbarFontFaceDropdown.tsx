import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuContainer from '@proton/components/components/dropdown/DropdownMenuContainer';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Badge } from '../../badge';
import { DEFAULT_FONT_FACE, FONT_FACES } from '../constants';
import { getFontFaceIdFromValue, getFontFaceValueFromId } from '../helpers/fontFace';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    /** Font value of current text selection */
    value?: string;
    setValue: (font: string) => void;
    /** DefaultValue is a FONT_FACES.font.id */
    defaultValue: MailSettings['FontFace'] | undefined;
    onClickDefault: () => void;
    showDefaultFontSelector?: boolean;
}

const getFontLabel = (font: string): string | undefined => {
    const lowerFont = font.toLowerCase();
    const fonts = Object.values(FONT_FACES);

    const search = fonts.find(({ value }) => lowerFont === value.toLowerCase());

    return search?.label;
};

const hasFont = (font: string): boolean => {
    const lowerFont = font.toLowerCase();
    const fonts = Object.values(FONT_FACES);

    return fonts.some(({ value }) => lowerFont === value.toLowerCase());
};

const displayDefaultFontButton = (
    defaultFontID: MailSettings['FontFace'] | undefined,
    fontId: string,
    canDisplayButton: boolean
) => {
    if (!canDisplayButton) {
        return false;
    }

    const defaultId = defaultFontID || getFontFaceIdFromValue(DEFAULT_FONT_FACE);
    const canDisplay = defaultId === fontId;

    return canDisplay;
};

const ToolbarFontFaceDropdown = ({ value, setValue, defaultValue, onClickDefault, showDefaultFontSelector }: Props) => {
    const defaultFontFaceValue = getFontFaceValueFromId(defaultValue);
    const [computedValue, setComputedValue] = useState(value || DEFAULT_FONT_FACE);

    const onChange = (nextFont: string) => {
        setComputedValue(nextFont);
        setValue(nextFont);
    };

    // Value changes when we move cursor to another place.
    // We reflect those changes to the computed value
    useEffect(() => {
        if (!value || !hasFont(value) || value === computedValue) {
            return;
        }

        if (value) {
            setComputedValue(value);
        }
    }, [value]);

    // defaultFontFaceValue changes when we select a new default value
    // We reflect those changes to the computedValue
    useEffect(() => {
        if (defaultFontFaceValue) {
            setComputedValue(defaultFontFaceValue);
        }
    }, [defaultFontFaceValue]);

    return (
        <ToolbarDropdown
            originalPlacement="bottom-start"
            className="composer-toolbar-fontDropDown flex-1 text-right flex overflow-hidden"
            title={c('Action').t`Font`}
            data-testid="editor-font-face"
            content={
                <span
                    data-testid="editor-toolbar:font-face:selected-value"
                    className="text-ellipsis text-left max-w-full"
                    style={{ display: 'inline-block', fontFamily: computedValue.toString() }}
                >
                    {getFontLabel(computedValue)}
                </span>
            }
        >
            <DropdownMenu>
                {Object.values(FONT_FACES).map(({ label: fontLabel, value: fontValue, id: fontId }) => (
                    <DropdownMenuContainer
                        key={fontId}
                        data-testid={`editor-toolbar:font-face:dropdown-item:${fontId}`}
                        className={clsx([fontValue === value && 'dropdown-item--is-selected'])}
                        buttonClassName="text-left"
                        aria-pressed={fontValue === value}
                        isSelected={fontValue === value}
                        onClick={() => onChange(fontValue)}
                        style={{ fontFamily: fontValue }}
                        buttonContent={<span className="pr-2">{fontLabel}</span>}
                        extraContent={
                            displayDefaultFontButton(defaultValue, fontId, !!showDefaultFontSelector) ? (
                                <div className="flex px-2 shrink-0">
                                    <Button
                                        color="weak"
                                        shape="ghost"
                                        className="inline-flex self-center text-no-decoration relative"
                                        onClick={onClickDefault}
                                        data-testid={`editor-toolbar:font-face:dropdown-item:${fontId}:default`}
                                    >
                                        <Badge className="color-info">{c('Font Face Default').t`Default`}</Badge>
                                    </Button>
                                </div>
                            ) : null
                        }
                    />
                ))}
            </DropdownMenu>
        </ToolbarDropdown>
    );
};

export default ToolbarFontFaceDropdown;
