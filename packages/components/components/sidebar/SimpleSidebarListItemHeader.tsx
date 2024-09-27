import type { ReactNode, Ref } from 'react';
import { useRef } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { HotkeyTuple } from '../../hooks';
import { useHotkeys } from '../../hooks';
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
    collapsed?: boolean;
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
    collapsed = false,
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
                    className="flex items-center flex-1 flex-nowrap text-left ml-0 navigation-link-header-group-link"
                    type="button"
                    onClick={() => onToggle(!toggle)}
                    title={title}
                    aria-expanded={toggle}
                    onFocus={() => onFocus(id || '')}
                    data-shortcut-target={id}
                    data-testid={testId}
                >
                    {hasCaret && (
                        <span className={clsx('shrink-0', collapsed && 'flex m-auto')}>
                            <Icon
                                name="chevron-down-filled"
                                className={clsx(['navigation-icon--expand', !toggle && 'rotateZ-270'])}
                            />
                        </span>
                    )}
                    <span className={clsx('ml-2 mt-0.5 text-ellipsis', collapsed && 'sr-only')}>{text}</span>
                </button>
                {right}
            </div>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemHeader;
