import { MutableRefObject, useState, useEffect } from 'react';
import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { DEFAULT_FONT_SIZE, FONT_SIZES } from '../squireConfig';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { listenToCursor, getFontSizeAtCursor } from '../squireActions';
import { SquireType } from '../interface';
import { Badge } from '../../badge';
import { classnames } from '../../../helpers';
import { SettingsLink } from '../../link';
import { DropdownMenu, DropdownMenuContainer } from '../../dropdown';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    defaultFontSize?: number;
}

const EditorToolbarFontSizeDropdown = ({ squireRef, editorReady, defaultFontSize }: Props) => {
    const [value, setValue] = useState(defaultFontSize || DEFAULT_FONT_SIZE);

    useEffect(
        () =>
            listenToCursor(squireRef.current, () => {
                const sizeAtCursor = getFontSizeAtCursor(squireRef.current);
                setValue(sizeAtCursor || defaultFontSize || DEFAULT_FONT_SIZE);
            }),
        [editorReady]
    );

    const handleClick = (size: number) => () => {
        setValue(size);
        squireRef.current.setFontSize(`${size}px`);
    };

    return (
        <SquireToolbarDropdown
            originalPlacement="bottom-left"
            content={value}
            className="flex-item-noshrink"
            title={c('Action').t`Size`}
        >
            <DropdownMenu>
                {Object.values(FONT_SIZES).map((size) => (
                    <DropdownMenuContainer
                        key={size}
                        className={classnames([size === value && 'dropdown-item--is-selected'])}
                        buttonClassName="text-left"
                        aria-pressed={size === value}
                        isSelected={size === value}
                        onClick={handleClick(size)}
                        buttonContent={<span>{size}</span>}
                        extraContent={
                            size === defaultFontSize ? (
                                <div className="flex pl0-5 pr0-5 flex-item-noshrink">
                                    <SettingsLink
                                        path="/appearance#other"
                                        app={APPS.PROTONMAIL}
                                        className="inline-flex flex-align-self-center text-no-decoration relative"
                                    >
                                        <Badge
                                            className="color-info"
                                            tooltip={c('Info').t`Change your default in settings`}
                                        >
                                            {c('Info').t`Default`}
                                        </Badge>
                                    </SettingsLink>
                                </div>
                            ) : null
                        }
                    />
                ))}
            </DropdownMenu>
        </SquireToolbarDropdown>
    );
};

export default EditorToolbarFontSizeDropdown;
