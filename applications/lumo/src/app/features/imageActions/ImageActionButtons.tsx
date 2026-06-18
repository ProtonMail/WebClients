import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcSquares } from '@proton/icons/icons/IcSquares';

import { IMAGE_STYLE_OPTIONS } from './styleOptions';

const BUTTON_STYLE = 'flex flex-row gap-2 flex-nowrap items-center w-fit-content';

export const ImageModifyButton = ({ onClick, className }: { onClick: () => void; className?: string }) => (
    <Button
        className={[BUTTON_STYLE, className].filter(Boolean).join(' ')}
        shape="solid"
        size="medium"
        onClick={onClick}
    >
        <IcPen size={3.5} />
        {c('collider_2025:Action').t`Modify...`}
    </Button>
);

export const ImageDownloadButton = ({ onClick }: { onClick: () => void }) => (
    <Button className={BUTTON_STYLE} shape="outline" size="medium" onClick={onClick}>
        <IcArrowDownLine size={3.5} />
        {c('collider_2025:Action').t`Download`}
    </Button>
);

interface ImageStyleDropdownProps {
    onSelect: (prompt: string) => void;
    /** Applies the `image-style-menu--side` modifier for inline/card usage. */
    side?: boolean;
    /** Stop click propagation on the popup (needed when a parent has an onClick close handler). */
    stopPropagation?: boolean;
}

export const ImageStyleDropdown = ({ onSelect, side = false, stopPropagation = false }: ImageStyleDropdownProps) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    const wrapperClass = ['image-style-menu relative inline-block', side ? 'image-style-menu--side' : '']
        .filter(Boolean)
        .join(' ');

    return (
        <span ref={menuRef} className={wrapperClass}>
            <Button className={BUTTON_STYLE} shape="outline" size="medium" onClick={() => setShowMenu((v) => !v)}>
                <IcSquares size={3.5} />
                {c('collider_2025:Action').t`Change style`}
                <IcChevronDownFilled
                    size={3}
                    style={{
                        transition: 'transform 0.15s',
                        transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </Button>
            {showMenu && (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <span
                    className="image-style-menu__popup absolute inline-flex flex-column gap-0.5 p-1 rounded-xl"
                    onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
                >
                    {IMAGE_STYLE_OPTIONS.map((style) => (
                        <button
                            key={style.id}
                            className="image-style-menu__item flex items-center w-full py-2 px-3 rounded-lg text-sm text-semibold text-left"
                            onClick={() => {
                                onSelect(style.prompt);
                                setShowMenu(false);
                            }}
                        >
                            {style.label}
                        </button>
                    ))}
                </span>
            )}
        </span>
    );
};
