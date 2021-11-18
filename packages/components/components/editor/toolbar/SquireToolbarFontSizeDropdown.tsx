import { MutableRefObject, useEffect } from 'react';
import { c } from 'ttag';
import { FONT_SIZES } from '../squireConfig';
import SquireToolbarDropdown from './SquireToolbarDropdown';
import { listenToCursor, getFontSizeAtCursor } from '../squireActions';
import { SquireType } from '../interface';
import { Badge } from '../../badge';
import { classnames } from '../../../helpers';
import { DropdownMenu, DropdownMenuContainer } from '../../dropdown';
import { Button } from '../../button';

interface Props {
    squireRef: MutableRefObject<SquireType>;
    editorReady: boolean;
    defaultValue: number;
    value: number;
    update: (nextFontSize: number) => void;
    onDefaultClick: () => void;
}

const EditorToolbarFontSizeDropdown = ({
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
                const sizeAtCursor = getFontSizeAtCursor(squireRef.current);
                update(sizeAtCursor || value);
            }),
        [editorReady]
    );

    const handleClick = (size: number) => () => {
        update(size);
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
                            size === defaultValue ? (
                                <div className="flex pl0-5 pr0-5 flex-item-noshrink">
                                    <Button
                                        color="weak"
                                        shape="ghost"
                                        className="inline-flex flex-align-self-center text-no-decoration relative"
                                        onClick={onDefaultClick}
                                    >
                                        <Badge className="color-info">{c('Font Size Default').t`Default`}</Badge>
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

export default EditorToolbarFontSizeDropdown;
