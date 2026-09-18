import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { SelectedDrawerOption } from './DrawerView';
import DrawerView from './DrawerView';
import SecurityCenter from './SecurityCenter/SecurityCenter';

import './SecurityCenter/SecurityCenter.scss';

interface Props {
    passAliasesView?: ReactNode;
}

const DrawerSecurityCenterView = ({ passAliasesView }: Props) => {
    const tab: SelectedDrawerOption = {
        text: c('Title').t`Security center`,
        value: 'security-center',
    };

    return (
        <DrawerView tab={tab} id="drawer-app-security-center" className="securityCenter bg-lowered">
            <SecurityCenter passAliasesView={passAliasesView} />
        </DrawerView>
    );
};

export default DrawerSecurityCenterView;
