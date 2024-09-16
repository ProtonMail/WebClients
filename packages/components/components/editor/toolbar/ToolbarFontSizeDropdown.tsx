import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuContainer from '@proton/components/components/dropdown/DropdownMenuContainer';
import clsx from '@proton/utils/clsx';

import { Badge } from '../../badge';
import { FONT_SIZES } from '../constants';
import ToolbarDropdown from './ToolbarDropdown';

interface Props {
    value?: string;
    setValue: (nextFontSize: string) => void;
    onClickDefault: () => void;
    defaultValue: string;
    showDefaultFontSelector: boolean;
}

const hasValue = (valueInPt: string): string | undefined => {
    return Object.entries(FONT_SIZES).find(([, ptValue]) => ptValue === valueInPt)?.[0];
};

const getCorrespondingValueInPt = (valueInPx: string): string | undefined => {
    return Object.entries(FONT_SIZES).find(([pxValue]) => pxValue === valueInPx)?.[1];
};

const ToolbarFontSizeDropdown = ({ setValue, value, onClickDefault, defaultValue, showDefaultFontSelector }: Props) => {
    const [computedValue, setComputedValue] = useState(value || defaultValue);
    const selectedValue = hasValue(computedValue) || computedValue;

    const onChange = (nextFontSizeInPt: string) => {
        setComputedValue(nextFontSizeInPt);
        setValue(nextFontSizeInPt);
    };

    useEffect(() => {
        if (value === computedValue) {
            return;
        }

        if (value) {
            setComputedValue(value);
        }
    }, [value]);

    useEffect(() => {
        const correspondingValue = getCorrespondingValueInPt(defaultValue);

        if (correspondingValue) {
            setComputedValue(correspondingValue);
        }
    }, [defaultValue]);

    return (
        <ToolbarDropdown
            originalPlacement="bottom-start"
            content={selectedValue}
            className="shrink-0"
            data-testid="editor-font-size"
            title={c('Action').t`Size`}
        >
            <DropdownMenu>
                {Object.entries(FONT_SIZES).map(([sizeInPx, sizeInPt]) => (
                    <DropdownMenuContainer
                        key={sizeInPt}
                        className={clsx([sizeInPt === value && 'dropdown-item--is-selected'])}
                        buttonClassName="text-left"
                        aria-pressed={sizeInPt === value}
                        isSelected={sizeInPt === value}
                        onClick={() => {
                            onChange(sizeInPt);
                        }}
                        data-testid={`editor-font-size-${sizeInPx}`}
                        buttonContent={<span>{sizeInPx}</span>}
                        extraContent={
                            sizeInPx === defaultValue && showDefaultFontSelector ? (
                                <div className="flex px-2 shrink-0">
                                    <Button
                                        color="weak"
                                        shape="ghost"
                                        className="inline-flex self-center text-no-decoration relative"
                                        onClick={onClickDefault}
                                    >
                                        <Badge className="color-info">{c('Font Size Default').t`Default`}</Badge>
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

export default ToolbarFontSizeDropdown;
