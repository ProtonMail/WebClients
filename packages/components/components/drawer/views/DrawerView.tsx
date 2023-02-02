import { AnimationEvent, ReactNode } from 'react';

import DrawerHeaderTitleDropdown from '@proton/components/components/drawer/views/DrawerHeaderTitleDropdown';
import { DrawerAppFooter, DrawerAppHeader } from '@proton/components/containers';

export interface SelectedDrawerOption {
    text: string;
    value: string;
}

interface Props {
    tab: SelectedDrawerOption;
    onSelectDrawerOption?: (option: SelectedDrawerOption) => void;
    options?: SelectedDrawerOption[];
    content: ReactNode;
    footerButtons?: JSX.Element[];
    onAnimationEnd?: () => void;
}

const DrawerView = ({ options, tab, onSelectDrawerOption, content, footerButtons, onAnimationEnd }: Props) => {
    const drawerHeaderTitle = options ? (
        <DrawerHeaderTitleDropdown title={tab.text} options={options} onClickOption={onSelectDrawerOption} />
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
        <div className="drawer-app-view h100 w100 flex flex-column" onAnimationEnd={handleOnAnimationEnd}>
            <DrawerAppHeader title={drawerHeaderTitle} />
            <div className="flex-item-fluid contacts-widget w100">{content}</div>
            {footerButtons && <DrawerAppFooter buttons={footerButtons} />}
        </div>
    );
};

export default DrawerView;
