import type { AnimationEvent, HTMLAttributes, ReactNode } from 'react';

import DrawerHeaderTitleDropdown from '@proton/components/components/drawer/views/DrawerHeaderTitleDropdown';
import DrawerAppFooter from '@proton/components/containers/drawer/DrawerAppFooter';
import DrawerAppHeader from '@proton/components/containers/drawer/DrawerAppHeader';
import clsx from '@proton/utils/clsx';

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
}

const DrawerView = ({
    options,
    tab,
    onSelectDrawerOption,
    footerButtons,
    onAnimationEnd,
    className,
    children,
    isUsingTabs = false,
    ...rest
}: Props) => {
    const drawerHeaderTitle = options ? (
        isUsingTabs ? (
            <DrawerHeaderTitleTabs title={tab.text} options={options} onClickOption={onSelectDrawerOption} />
        ) : (
            <DrawerHeaderTitleDropdown title={tab.text} options={options} onClickOption={onSelectDrawerOption} />
        )
    ) : (
        tab.text
    );

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
                isUsingTabs={isUsingTabs}
            />
            <div className="flex-1 contacts-widget w-full">{children}</div>
            {footerButtons && <DrawerAppFooter buttons={footerButtons} />}
        </div>
    );
};

export default DrawerView;
