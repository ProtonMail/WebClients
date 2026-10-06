import { Fragment, type ReactNode, type Ref } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import type { IconProps } from '@proton/components/components/icon/Icon';
import Toggle from '@proton/components/components/toggle/Toggle';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { ConditionalTooltip } from '../../../atoms/ConditionalTooltip/ConditionalTooltip';

type MoreMenuIcon = (props: Pick<IconProps, 'size' | 'className'>) => JSX.Element;

const itemClassName =
    'more-menu-item flex flex-nowrap items-center gap-3 w-full min-h-custom py-2 px-3 rounded-lg text-lg color-norm';
const itemStyle = { '--min-h-custom': '3rem' };
const itemIconClassName = 'more-menu-item-icon color-weak shrink-0';

export interface MoreMenuToggle {
    id: string;
    Icon: MoreMenuIcon;
    label: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    loading?: boolean;
    tooltip?: string;
}

export interface MoreMenuAction {
    id: string;
    Icon: MoreMenuIcon;
    label: string;
    onClick: () => void;
    rightContent?: ReactNode;
}

const MoreMenuToggleItem = ({ id, Icon, label, checked, onChange, disabled, loading, tooltip }: MoreMenuToggle) => {
    const inputId = `more-menu-${id}`;

    return (
        <div className={itemClassName} style={itemStyle}>
            <Icon size={5} className={itemIconClassName} />
            <label htmlFor={inputId} className="flex-1 min-w-0 text-ellipsis cursor-pointer">
                {label}
            </label>
            <ConditionalTooltip title={tooltip}>
                <Toggle
                    id={inputId}
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    loading={loading}
                    className={clsx('setting-toggle shrink-0', !checked && 'setting-toggle-inactive')}
                />
            </ConditionalTooltip>
        </div>
    );
};

interface MoreMenuButtonItemProps {
    Icon: MoreMenuIcon;
    label: string;
    onClick: () => void;
    rightContent?: ReactNode;
    buttonRef?: Ref<HTMLButtonElement>;
    ariaExpanded?: boolean;
    ariaHasPopup?: React.AriaAttributes['aria-haspopup'];
}

export const MoreMenuButtonItem = ({
    Icon,
    label,
    onClick,
    rightContent,
    buttonRef,
    ariaExpanded,
    ariaHasPopup,
}: MoreMenuButtonItemProps) => (
    <Button
        ref={buttonRef}
        shape="ghost"
        className={clsx(itemClassName, 'more-menu-item--interactive text-left')}
        style={itemStyle}
        onClick={onClick}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
    >
        <Icon size={5} className={itemIconClassName} />
        <span className="flex-1 min-w-0 text-ellipsis">{label}</span>
        {rightContent}
    </Button>
);

const MoreMenuDivider = ({ className = 'my-1' }: { className?: string }) => (
    <hr className={clsx('w-full h-0 border-top border-card bg-transparent', className)} />
);

interface MoreMenuSectionsProps {
    headerItem?: ReactNode;
    leadingSections?: MoreMenuAction[][];
    toggles: MoreMenuToggle[];
    layoutItem?: ReactNode;
    actions: MoreMenuAction[];
    /** Called after any action runs; toggles keep the menu open. */
    onClose: () => void;
    dividerClassName?: string;
}

export const MoreMenuSections = ({
    headerItem,
    leadingSections = [],
    toggles,
    layoutItem,
    actions,
    onClose,
    dividerClassName,
}: MoreMenuSectionsProps) => {
    const renderActions = (items: MoreMenuAction[]) =>
        items.length > 0 &&
        items.map(({ id, Icon, label, onClick, rightContent }) => (
            <MoreMenuButtonItem
                key={id}
                Icon={Icon}
                label={label}
                rightContent={rightContent}
                onClick={() => {
                    onClick();
                    onClose();
                }}
            />
        ));

    const sections = [
        headerItem,
        ...leadingSections.map(renderActions),
        toggles.length > 0 && toggles.map((toggle) => <MoreMenuToggleItem key={toggle.id} {...toggle} />),
        layoutItem,
        renderActions(actions),
    ].filter(isTruthy);

    return (
        <>
            {sections.map((section, index) => (
                <Fragment key={index}>
                    {index > 0 && <MoreMenuDivider className={dividerClassName} />}
                    {section}
                </Fragment>
            ))}
        </>
    );
};
