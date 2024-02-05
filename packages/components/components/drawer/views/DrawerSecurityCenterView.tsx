import { c } from 'ttag';

import DrawerView, { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';

import SecurityCenter from './SecurityCenter/SecurityCenter';

import './SecurityCenter/SecurityCenter.scss';

const DrawerSecurityCenterView = () => {
    const tab: SelectedDrawerOption = {
        text: c('Title').t`Security center`,
        value: 'security-center',
    };

    return (
        <DrawerView tab={tab} id="drawer-app-security-center" className="securityCenter">
            <SecurityCenter />
        </DrawerView>
    );
};

export default DrawerSecurityCenterView;
