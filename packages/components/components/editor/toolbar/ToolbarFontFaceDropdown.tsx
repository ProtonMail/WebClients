import { c } from 'ttag';
import { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContainer } from '../../dropdown';
import { FONT_FACE } from '../constants';
import ToolbarDropdown from './ToolbarDropdown';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { classnames } from '../../../helpers';

interface Props {
    value?: string;
    setValue: (font: string) => void;
    defaultValue: string;
    onClickDefault: () => void;
    showDefaultFontSelector?: boolean;
}

const getFontLabel = (font: string) =>
    Object.entries(FONT_FACE).find(([, value]) => {
        return value === font;
    })?.[0];

const hasFont = (font: string | undefined) =>
    font &&
    Object.entries(FONT_FACE).find(([, fontValue]) => {
        return fontValue === font;
    });

const ToolbarFontFaceDropdown = ({ value, setValue, defaultValue, onClickDefault, showDefaultFontSelector }: Props) => {
    const [computedValue, setComputedValue] = useState(value || defaultValue);

    const onChange = (nextFont: string) => {
        setComputedValue(nextFont);
        setValue(nextFont);
    };

    useEffect(() => {
        if (!hasFont(value) || value === computedValue) {
            return;
        }

        if (value) {
            setComputedValue(value);
        }
    }, [value]);

    useEffect(() => {
        if (defaultValue) {
            setComputedValue(defaultValue);
        }
    }, [defaultValue]);

    return (
        <ToolbarDropdown
            originalPlacement="bottom-left"
            className="composer-toolbar-fontDropDown flex-item-fluid text-right flex no-scroll"
            title={c('Action').t`Font`}
            content={
                <span
                    className="text-ellipsis text-left max-w100"
                    style={{ display: 'inline-block', fontFamily: computedValue.toString() }}
                >
                    {getFontLabel(computedValue)}
                </span>
            }
        >
            <DropdownMenu>
                {Object.values(FONT_FACE).map((font) => (
                    <DropdownMenuContainer
                        key={font}
                        className={classnames([font === value && 'dropdown-item--is-selected'])}
                        buttonClassName="text-left"
                        aria-pressed={font === value}
                        isSelected={font === value}
                        onClick={() => onChange(font)}
                        style={{ fontFamily: font.toString() }}
                        buttonContent={<span className="pr0-5">{getFontLabel(font)}</span>}
                        extraContent={
                            font === defaultValue && showDefaultFontSelector ? (
                                <div className="flex pl0-5 pr0-5 flex-item-noshrink">
                                    <Button
                                        color="weak"
                                        shape="ghost"
                                        className="inline-flex flex-align-self-center text-no-decoration relative"
                                        onClick={onClickDefault}
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
