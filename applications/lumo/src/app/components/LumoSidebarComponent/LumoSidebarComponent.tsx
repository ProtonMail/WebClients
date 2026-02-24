import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Hamburger, Icon, UserDropdown, useFocusTrap } from '@proton/components';
import lumoLogoFull from '@proton/styles/assets/img/lumo/lumo-logo-full.svg';
import useConfig from '@proton/components/hooks/useConfig';
import { getAppName } from '@proton/shared/lib/apps/helper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useSidebar } from '../../providers/SidebarProvider';

import './SidebarButton.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    app: APP_NAMES;
    expanded?: boolean;
    onToggleExpand?: () => void;
    children?: ReactNode;
    version?: ReactNode;

    /**
     * If `true`, the sidebar children container will grow to the maximum
     * available size.
     *
     * This is the default behavior, set this to `false` if you want the footer
     * to stick to the content.
     *
     * @default true
     */
    growContent?: boolean;
    // showStorage?: boolean;
    /**
     * Only when collapse button is present
     */
    collapsed?: boolean;
    navigationRef?: Ref<HTMLDivElement>;
    isGuest: boolean;
}

const SidebarButton = () => {
    const { isCollapsed, isVisible, toggle } = useSidebar();

    if (!isVisible) {
        return null;
    }

    return (
        <span className={clsx('mt-auto')}>
            <Tooltip
                title={!isCollapsed ? c('Action').t`Collapse navigation bar` : c('Action').t`Display navigation bar`}
                originalPlacement="right"
            >
                <Button
                    icon
                    className="sidebar-button hidden sm:flex absolute bottom-custom right-custom rounded-full"
                    size="small"
                    onClick={toggle}
                    style={{ '--bottom-custom': '48px', '--right-custom': '-12px' }}
                >
                    <Icon
                        size={4}
                        name={isVisible && !isCollapsed ? 'chevron-left' : 'chevron-right'}
                        alt={c('Action').t`Show navigation bar`}
                    />
                </Button>
            </Tooltip>
        </span>
    );
};

// Sidebar component modified for Lumo (unathenticated and authenticated users)
const LumoSidebarComponent = ({
    app,
    expanded = false,
    onToggleExpand,
    children,
    growContent = true,
    collapsed = false,
    className,
    isGuest,
    navigationRef,
    ...rest
}: Props) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const focusTrapProps = useFocusTrap({
        active: expanded,
        rootRef,
    });
    const { APP_NAME } = useConfig();
    const { isSmallScreen } = useSidebar();

    return (
        <div className="relative">
            <div
                ref={rootRef}
                className={clsx(
                    'sidebar h-full flex flex-nowrap flex-column no-print outline-none border-right border-top border-weak pb-5',
                    collapsed && 'sidebar--collapsed',
                    className
                )}
                data-expanded={expanded}
                {...rest}
                {...focusTrapProps}
            >
                <Hamburger
                    expanded={expanded}
                    onToggle={onToggleExpand}
                    className="md:hidden shrink-0 absolute right-0 mr-5 mt-2 opacity-0 focus:opacity-100 bg-norm"
                />

                <h1 className="sr-only">{getAppName(APP_NAME)}</h1>

                {isSmallScreen && !isGuest && expanded ? (
                    <>
                        <div className="mobile-user-dropdown px-3 mt-1 shrink-0 md:hidden mb-2">
                            <UserDropdown app={APP_NAME} />
                        </div>
                    </>
                ) : null}
                {isSmallScreen && isGuest && expanded ? (
                    <div className="px-3 mt-1 shrink-0 md:hidden mb-2">
                        {/* Lumo Logo */}
                        <div className="sidebar-logo-section p-3">
                            <img src={lumoLogoFull} alt="Lumo" className="sidebar-logo" />
                        </div>
                    </div>
                ) : null}

                <div className="mt-1 md:mt-0" aria-hidden="true" />
                <div
                    className={clsx(
                        growContent ? 'flex-1' : 'grow-0',
                        'flex-nowrap flex flex-column md:mt-2',
                        !collapsed && 'overflow-overlay'
                    )}
                    tabIndex={-1}
                    ref={navigationRef}
                >
                    {children}
                </div>
            </div>
            {
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                expanded ? <div className="sidebar-backdrop" onClick={onToggleExpand}></div> : undefined
            }
            <SidebarButton />
        </div>
    );
};

export default LumoSidebarComponent;
