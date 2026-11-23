import { useRef } from 'react';

import { c } from 'ttag';

import SettingsPageTitle from '@proton/components/containers/account/SettingsPageTitle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import BackToMenuButton from '@proton/components/containers/layout/BackToMenuButton';
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea';
import { useFocusMainOnNavigation } from '@proton/components/containers/layout/useFocusMainOnNavigation';
import PlansSection from '@proton/payments-ui/containers/payments/PlansSection';
import type { APP_NAMES } from '@proton/shared/lib/constants';

interface Props {
    app: APP_NAMES;
}

const UpgradePage = ({ app }: Props) => {
    const mainAreaRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useFocusMainOnNavigation(mainAreaRef, titleRef);

    return (
        <PrivateMainArea ref={mainAreaRef}>
            <div className="container-section-sticky">
                <BackToMenuButton />
                <div className="text-center flex">
                    <SettingsSectionWide className="mx-auto">
                        <SettingsPageTitle ref={titleRef} tabIndex={-1} className="my-14 outline-none--at-all">
                            {c('new_plans: title').t`Unlock premium features by upgrading`}
                        </SettingsPageTitle>
                        <PlansSection app={app} />
                    </SettingsSectionWide>
                </div>
            </div>
        </PrivateMainArea>
    );
};

export default UpgradePage;
