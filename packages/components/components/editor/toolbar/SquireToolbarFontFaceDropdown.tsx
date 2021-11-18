import { MutableRefObject, useEffect } from 'react';
import { c } from 'ttag';
import { DropdownMenu, DropdownMenuContainer } from '../../dropdown';
import { FONT_FACE } from '../squireConfig';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { listenToCursor, getFontFaceAtCursor, getFontLabel } from '../squireActions';
import { SquireType } from '../interface';
import { Badge } from '../../badge';
import { Button } from '../../button';
import { classnames } from '../../../helpers';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    defaultValue: string;
    value: string;
    update: (nextFontSize: string) => void;
    onDefaultClick: () => void;
}

const SquireToolbarFontFaceDropdown = ({
    squireRef,
    editorReady,
    defaultValue,
    value,
    update,
    onDefaultClick,
}: Props) => {
    useEffect(
        () =>
            listenToCursor(squireRef.current, () => {
                const fontAtCursor = getFontFaceAtCursor(squireRef.current);
                update(fontAtCursor || defaultValue);
            }),
        [editorReady]
    );

    const handleClick = (font: FONT_FACE) => () => {
        update(font);
        squireRef.current.setFontFace(font.toString());
    };

    return (
        <SquireToolbarDropdown
            originalPlacement="bottom-left"
            className="composer-toolbar-fontDropDown flex-item-fluid text-right flex no-scroll"
            title={c('Action').t`Font`}
            content={
                <span
                    className="text-ellipsis text-left max-w100"
                    style={{ display: 'inline-block', fontFamily: value.toString() }}
                >
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
                            font === defaultValue ? (
                                <div className="flex pl0-5 pr0-5 flex-item-noshrink">
                                    <Button
                                        color="weak"
                                        shape="ghost"
                                        className="inline-flex flex-align-self-center text-no-decoration relative"
                                        onClick={onDefaultClick}
                                    >
                                        <Badge className="color-info">{c('Font Face Default').t`Default`}</Badge>
                                    </Button>
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
