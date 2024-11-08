import type { ReactNode, Ref } from 'react';
import { useRef } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { type HotkeyTuple, useHotkeys } from '../../hooks/useHotkeys';
import SidebarListItem from './SidebarListItem';

interface Props {
    toggle: boolean;
    onToggle: (display: boolean) => void;
    hasCaret?: boolean;
    right?: ReactNode;
    text: string;
    subText?: string;
    title?: string;
    onFocus?: (id: string) => void;
    id?: string;
    testId?: string;
    headerRef?: Ref<HTMLDivElement>;
    spaceAbove?: boolean;
    collapsed?: boolean;
    className?: string;
    buttonClassName?: string;
    forceMinBlockSize?: boolean;
}

const SimpleSidebarListItemHeader = ({
    toggle,
    onToggle,
    hasCaret = true,
    right,
    text,
    subText,
    id,
    testId,
    headerRef,
    title,
    onFocus = noop,
    spaceAbove = false,
    collapsed = false,
    className,
    buttonClassName,
    forceMinBlockSize = false,
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
                forceMinBlockSize && 'navigation-link-header-group--force-min-block-size',
                hasCaret && 'navigation-link-header-group--expandable',
                spaceAbove && 'mt-4',
            ])}
        >
            <div className={clsx('flex flex-nowrap w-full', className)} ref={headerRef}>
                <h3 className="sr-only">{text}</h3>
                <button
                    ref={buttonRef}
                    className={clsx(
                        'flex flex-1 flex-nowrap text-left ml-0 navigation-link-header-group-link',
                        forceMinBlockSize && 'navigation-link-header-group-link--force-min-block-size',
                        subText ? 'items-start' : 'items-center',
                        buttonClassName
                    )}
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
                    {subText ? (
                        <div className="ml-2">
                            <div className={clsx('mt-0.5 text-ellipsis', collapsed && 'sr-only')}>{text}</div>
                            <div className={clsx('mt-0.5 text-ellipsis text-sm', collapsed && 'sr-only')}>
                                {subText}
                            </div>
                        </div>
                    ) : (
                        <span className={clsx('ml-2 mt-0.5 text-ellipsis', collapsed && 'sr-only')}>{text}</span>
                    )}
                </button>
                {right}
            </div>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemHeader;
