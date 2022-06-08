import { ReactNode, useRef } from 'react';
import noop from '@proton/utils/noop';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers';
import SidebarListItem from './SidebarListItem';
import { HotkeyTuple, useHotkeys } from '../../hooks';
import ButtonLike from '../button/ButtonLike';

interface Props {
    toggle: boolean;
    onToggle: (display: boolean) => void;
    hasCaret?: boolean;
    right?: ReactNode;
    text: string;
    title?: string;
    onFocus?: (id: string) => void;
    id?: string;
}

const SimpleSidebarListItemHeader = ({
    toggle,
    onToggle,
    hasCaret = true,
    right,
    text,
    id,
    title,
    onFocus = noop,
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
            className={classnames([
                'navigation-link-header-group',
                hasCaret && 'navigation-link-header-group--expandable',
            ])}
        >
            <div className="flex flex-nowrap">
                <button
                    ref={buttonRef}
                    className="text-uppercase flex flex-align-items-center flex-item-fluid text-left navigation-link-header-group-link"
                    type="button"
                    onClick={() => onToggle(!toggle)}
                    title={title}
                    aria-expanded={toggle}
                    onFocus={() => onFocus(id || '')}
                    data-shortcut-target={id}
                >
                    {hasCaret && (
                        <ButtonLike as="span" color="weak" shape="ghost" size="small" icon>
                            <Icon
                                name="chevron-down"
                                className={classnames(['navigation-icon--expand', !toggle && 'rotateZ-270'])}
                            />
                        </ButtonLike>
                    )}
                    <span className="ml0-25 text-sm">{text}</span>
                </button>
                {right}
            </div>
        </SidebarListItem>
    );
};

export default SimpleSidebarListItemHeader;
