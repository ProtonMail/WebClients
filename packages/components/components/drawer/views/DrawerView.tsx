import { ReactNode } from 'react';

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
}

const DrawerView = ({ options, tab, onSelectDrawerOption, content, footerButtons }: Props) => {
    const drawerHeaderTitle = options ? (
        <DrawerHeaderTitleDropdown title={tab.text} options={options} onClickOption={onSelectDrawerOption} />
    ) : (
        tab.text
    );

    return (
        <div className="drawer-app-view h100 w100 flex flex-column">
            <DrawerAppHeader title={drawerHeaderTitle} />
            <div className="flex-item-fluid contacts-widget w100">{content}</div>
            {footerButtons && <DrawerAppFooter buttons={footerButtons} />}
        </div>
    );
};

export default DrawerView;
