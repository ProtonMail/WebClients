import type { AnimationEvent, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import DrawerAppFooter from '../../../containers/drawer/DrawerAppFooter';
import DrawerAppHeader from '../../../containers/drawer/DrawerAppHeader';
import DrawerHeaderTitleDropdown from './DrawerHeaderTitleDropdown';
import DrawerHeaderTitleTabs from './DrawerHeaderTitleTabs';

export interface SelectedDrawerOption {
    text: string;
    value: string;
    backgroundClass?: string;
}

interface Props extends Omit<HTMLAttributes<HTMLElement>, 'content'> {
    tab: SelectedDrawerOption;
    onSelectDrawerOption?: (option: SelectedDrawerOption) => void;
    options?: SelectedDrawerOption[];
    children: ReactNode;
    footerButtons?: JSX.Element[];
    onAnimationEnd?: () => void;
    isUsingTabs?: boolean;
    /** Replaces the header title for single-view drawers; the tabbed and dropdown titles ignore it. */
    titleContent?: ReactNode;
    /** View-specific buttons rendered in the header, just before the Close button. */
    headerActions?: ReactNode;
    /** Class for the content wrapper; defaults to `contacts-widget`. Pass this to opt out of it. */
    contentClassName?: string;
}

const DrawerView = ({
    options,
    tab,
    titleContent,
    onSelectDrawerOption,
    footerButtons,
    onAnimationEnd,
    className,
    children,
    isUsingTabs = false,
    headerActions,
    contentClassName,
    ...rest
}: Props) => {
    const renderDrawerHeaderTitle = () => {
        if (!options) {
            return titleContent ?? tab.text;
        }
        if (isUsingTabs) {
            return <DrawerHeaderTitleTabs title={tab.text} options={options} onClickOption={onSelectDrawerOption} />;
        }
        return <DrawerHeaderTitleDropdown title={tab.text} options={options} onClickOption={onSelectDrawerOption} />;
    };

    const drawerHeaderTitle = renderDrawerHeaderTitle();

    // The opening animation is creating flickers when we want to autofocus an input
    // We need to perform the focus action once the animation has ended
    const handleOnAnimationEnd = ({ animationName }: AnimationEvent) => {
        if (animationName.includes('drawer-app-view')) {
            onAnimationEnd?.();
        }
    };

    return (
        <div
            className={clsx('drawer-app-view h-full w-full flex flex-column', className)}
            onAnimationEnd={handleOnAnimationEnd}
            {...rest}
        >
            <DrawerAppHeader
                headerClassName={tab.backgroundClass}
                title={drawerHeaderTitle}
                headerActions={headerActions}
                isUsingTabs={isUsingTabs}
            />
            <div className={clsx('flex-1 w-full', contentClassName ?? 'contacts-widget')}>{children}</div>
            {footerButtons && <DrawerAppFooter buttons={footerButtons} />}
        </div>
    );
};

export default DrawerView;
