import { ReactNode, Ref, useRef } from 'react';

import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { HotkeyTuple, useHotkeys } from '../../hooks';
import Icon from '../icon/Icon';
import SidebarListItem from './SidebarListItem';

interface Props {
    toggle: boolean;
    onToggle: (display: boolean) => void;
    hasCaret?: boolean;
    right?: ReactNode;
    text: string;
    title?: string;
    onFocus?: (id: string) => void;
    id?: string;
    testId?: string;
    headerRef?: Ref<HTMLDivElement>;
    spaceAbove?: boolean;
}

const SimpleSidebarListItemHeader = ({
    toggle,
    onToggle,
    hasCaret = true,
    right,
    text,
    id,
    testId,
    headerRef,
    title,
    onFocus = noop,
    spaceAbove = false,
}: Props) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowRight',
            (e) => {
                e.stopPropagation();
                onToggle(true);
            },
        ],
        [
            'ArrowLeft',
            () => {
                onToggle(false);
            },
        ],
    ];

    useHotkeys(buttonRef, shortcutHandlers);

    return (
        <SidebarListItem
            className={clsx([
                'navigation-link-header-group',
                hasCaret && 'navigation-link-header-group--expandable',
                spaceAbove && 'mt-4',
            ])}
        >
            <div className="flex flex-nowrap w-full" ref={headerRef}>
                <h3 className="sr-only">{text}</h3>
                <button
                    ref={buttonRef}
                    className="flex items-center flex-item-fluid flex-nowrap text-left ml-0 navigation-link-header-group-link"
                    type="button"
                    onClick={() => onToggle(!toggle)}
                    title={title}
                    aria-expanded={toggle}
                    onFocus={() => onFocus(id || '')}
                    data-shortcut-target={id}
                    data-testid={testId}
                >
                    {hasCaret && (
                        <span className="flex-item-noshrink">
                            <Icon
                                name="chevron-down-filled"
                                className={clsx(['navigation-icon--expand', !toggle && 'rotateZ-270'])}
                            />
                        </span>
                    )}
                    <span className="ml-2 mt-0.5 text-ellipsis">{text}</span>
                </button>
                {right}
            </div>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemHeader;
