import { MutableRefObject, useState, useEffect } from 'react';
import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';
import { DropdownMenu, DropdownMenuContainer } from '../../dropdown';
import { DEFAULT_FONT_FACE, FONT_FACE } from '../squireConfig';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { listenToCursor, getFontFaceAtCursor, getFontLabel } from '../squireActions';
import { SquireType } from '../interface';
import { Badge } from '../../badge';
import { SettingsLink } from '../../link';
import { classnames } from '../../../helpers';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    defaultFontFace?: string;
}

const SquireToolbarFontFaceDropdown = ({ squireRef, editorReady, defaultFontFace }: Props) => {
    const [value, setValue] = useState<string>(defaultFontFace || DEFAULT_FONT_FACE);

    useEffect(
        () =>
            listenToCursor(squireRef.current, () => {
                const fontAtCursor = getFontFaceAtCursor(squireRef.current);
                setValue(fontAtCursor || defaultFontFace || DEFAULT_FONT_FACE);
            }),
        [editorReady]
    );

    const handleClick = (font: FONT_FACE) => () => {
        setValue(font);
        squireRef.current.setFontFace(font.toString());
    };

    return (
        <SquireToolbarDropdown
            originalPlacement="bottom-left"
            className="composer-toolbar-fontDropDown text-right flex no-scroll"
            title={c('Action').t`Font`}
            content={
                <span className="text-ellipsis max-w100" style={{ fontFamily: value.toString() }}>
                    {getFontLabel(value as FONT_FACE)}
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
                        onClick={handleClick(font)}
                        style={{ fontFamily: font.toString() }}
                        buttonContent={<span className="pr0-5">{getFontLabel(font)}</span>}
                        extraContent={
                            font === defaultFontFace ? (
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
                                            {c('Font Face Default').t`Default`}
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

export default SquireToolbarFontFaceDropdown;
