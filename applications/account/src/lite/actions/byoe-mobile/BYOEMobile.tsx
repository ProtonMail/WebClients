import { c } from 'ttag';

import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Toggle from '@proton/components/components/toggle/Toggle';
import useToggle from '@proton/hooks/useToggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import icon from '@proton/styles/assets/img/byoe/mobile-gmail-app-icon.svg';

import MobileSection from '../../components/MobileSection';
import MobileSectionLabel from '../../components/MobileSectionLabel';
import MobileSectionRow from '../../components/MobileSectionRow';
import { BYOEMobileConnecting } from './BYOEMobileConnecting';
import { BYOEMobileProvider, useBYOEMobile } from './context/BYOEMobileProvider';

import '../MobileSettings.scss';

const BYOEMobileContent = () => {
    const { isLoading, defaultImportEmails, status, connectingEmail, startOAuthFlowIfAllowed } = useBYOEMobile();
    const { state: shouldImportEmails, toggle } = useToggle(defaultImportEmails);

    if (status === 'connecting') {
        return <BYOEMobileConnecting email={connectingEmail} />;
    }

    if (status === 'auto-starting') {
        return (
            <div className="mobile-settings flex items-center justify-center h-full">
                <CircleLoader size="large" />
            </div>
        );
    }

    const isStartingOAuth = status === 'starting-oauth';

    return (
        <div className="mobile-settings">
            <MobileSection>
                <MobileSectionRow stackContent>
                    <img src={icon} alt="" height={68} width={74} className="mb-4" />
                    <h2 className="text-3xl text-bold m-0 mb-2">{c('Title').t`Connected addresses`}</h2>
                    <p className="color-weak m-0 mb-3">{c('Description')
                        .t`No ads, no tracking. Use your Gmail in ${BRAND_NAME}. Nothing there gets edited or deleted.`}</p>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="import-toggle"
                        description={<span>{c('Label').t`Start with your most recent messages`}</span>}
                    >
                        {c('Label').t`Import your emails`}
                    </MobileSectionLabel>
                    <Toggle
                        id="import-toggle"
                        checked={shouldImportEmails}
                        onChange={toggle}
                        disabled={isStartingOAuth}
                    />
                </MobileSectionRow>
                <MobileSectionRow>
                    <Button
                        fullWidth
                        size="large"
                        color="norm"
                        shape="solid"
                        className="rounded-full"
                        onClick={() => startOAuthFlowIfAllowed(shouldImportEmails)}
                        loading={isStartingOAuth}
                        disabled={isLoading}
                    >
                        {shouldImportEmails ? c('Action').t`Connect and import` : c('Action').t`Connect`}
                    </Button>
                </MobileSectionRow>
            </MobileSection>
        </div>
    );
};

interface Props {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    /** Native app URL to hand control back to once the address is connected. */
    redirect: string | undefined;
    /** Search params from the first load: the URL is rewritten by the login flow before this component mounts. */
    initialSearchParams: URLSearchParams;
}

export const BYOEMobile = ({ layout, redirect, initialSearchParams }: Props) => {
    return layout(
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                <BYOEMobileProvider redirect={redirect} initialSearchParams={initialSearchParams}>
                    <BYOEMobileContent />
                </BYOEMobileProvider>
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>,
        { className: 'overflow-auto' }
    );
};
