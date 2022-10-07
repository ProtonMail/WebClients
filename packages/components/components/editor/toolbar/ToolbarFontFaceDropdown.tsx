import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';

import { classnames } from '../../../helpers';
import { Badge } from '../../badge';
import { DropdownMenu, DropdownMenuContainer } from '../../dropdown';
import { FONT_FACES } from '../constants';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    value?: string;
    setValue: (font: string) => void;
    defaultValue: string;
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

const ToolbarFontFaceDropdown = ({ value, setValue, defaultValue, onClickDefault, showDefaultFontSelector }: Props) => {
    const [computedValue, setComputedValue] = useState(value || defaultValue);

    const onChange = (nextFont: string) => {
        setComputedValue(nextFont);
        setValue(nextFont);
    };

    useEffect(() => {
        if (!value || !hasFont(value) || value === computedValue) {
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
            originalPlacement="bottom-start"
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
                {Object.values(FONT_FACES).map(({ label: fontLabel, value: fontValue }) => (
                    <DropdownMenuContainer
                        key={fontValue}
                        className={classnames([fontValue === value && 'dropdown-item--is-selected'])}
                        buttonClassName="text-left"
                        aria-pressed={fontValue === value}
                        isSelected={fontValue === value}
                        onClick={() => onChange(fontValue)}
                        style={{ fontFamily: fontValue }}
                        buttonContent={<span className="pr0-5">{fontLabel}</span>}
                        extraContent={
                            fontValue.toLowerCase() === (defaultValue || '').toLowerCase() &&
                            showDefaultFontSelector ? (
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
