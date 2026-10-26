import { useEffect } from 'react';

import { c } from 'ttag';

import ReachedLimitForwardingModal from '@proton/activation/src/components/Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Toggle from '@proton/components/components/toggle/Toggle';
import useToggle from '@proton/hooks/useToggle';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import icon from '@proton/styles/assets/img/byoe/mobile-gmail-app-icon.svg';

import MobileSection from '../../components/MobileSection';
import MobileSectionLabel from '../../components/MobileSectionLabel';
import MobileSectionRow from '../../components/MobileSectionRow';
import { BYOEMobileConnecting } from './BYOEMobileConnecting';
import { BYOEMobileConnections } from './components/BYOEMobileConnections/BYOEMobileConnections';
import { ErrorPrompt } from './components/ErrorPrompt';
import { BYOEMobileProvider, useBYOEMobile } from './context/BYOEMobileProvider';

import '../MobileSettings.scss';
import './BYOEMobile.scss';

const BYOEMobileContent = () => {
    const { isLoading, defaultImportEmails, limitReached, status, connectingEmail, startOAuthFlowIfAllowed } =
        useBYOEMobile();
    const { state: shouldImportEmails, toggle } = useToggle(defaultImportEmails);

    const [modalProps, setPaidLimitModalOpen, render] = useModalState();

    if (status === 'connecting') {
        return <BYOEMobileConnecting email={connectingEmail} />;
    }

    if (status === 'auto-starting') {
        return (
            <div
                className="flex items-center justify-center min-h-custom"
                style={{ '--min-h-custom': 'calc(100dvh - 2rem)' }}
            >
                <CircleLoader size="large" />
            </div>
        );
    }

    const isStartingOAuth = status === 'starting-oauth';

    const getButtonCopy = () => {
        if (limitReached === 'free-limit') {
            return c('Action').t`Upgrade to connect`;
        }

        return shouldImportEmails ? c('Action').t`Connect and import` : c('Action').t`Connect`;
    };

    const handleClick = () => {
        if (limitReached === 'paid-limit') {
            setPaidLimitModalOpen(true);
        } else {
            startOAuthFlowIfAllowed(shouldImportEmails);
        }
    };

    return (
        <>
            <MobileSection>
                <MobileSectionRow stackContent>
                    <img src={icon} alt="" height={68} width={74} className="mb-4 byoe-mobile-icon" />
                    <h2 className="text-3xl text-bold m-0 mb-1.5">{c('Title').t`Connect your Gmail`}</h2>
                    <p className="color-weak m-0">{c('Description')
                        .t`No ads, no tracking. Use your Gmail in ${BRAND_NAME}. Nothing there gets edited or deleted.`}</p>
                </MobileSectionRow>
                <MobileSectionRow>
                    <MobileSectionLabel
                        htmlFor="import-toggle"
                        description={<span>{c('Label').t`Start with your most recent`}</span>}
                    >
                        {c('Label').t`Import your emails`}
                    </MobileSectionLabel>
                    <Toggle id="import-toggle" checked={shouldImportEmails} onChange={toggle} disabled={isLoading} />
                </MobileSectionRow>
                <MobileSectionRow>
                    <Button
                        fullWidth
                        size="large"
                        color="norm"
                        shape="solid"
                        className="rounded-full"
                        onClick={handleClick}
                        loading={isStartingOAuth}
                        disabled={isLoading}
                    >
                        {getButtonCopy()}
                    </Button>
                </MobileSectionRow>
            </MobileSection>
            <ErrorPrompt />
            <BYOEMobileConnections />
            {render && <ReachedLimitForwardingModal {...modalProps} />}
        </>
    );
};

interface Props {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    /** Native app URL to hand control back to once the address is connected. */
    redirect: string | undefined;
    /** Search params from the first load: the URL is rewritten by the login flow before this component mounts. */
    initialSearchParams: URLSearchParams;
}

/** Lets the background extend under the notch and the home indicator, the padding in the styles keeps the content clear of them. */
const useExtendIntoSafeAreas = () => {
    useEffect(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const previous = viewport?.getAttribute('content');
        if (!viewport || previous === null || previous === undefined) {
            return;
        }

        viewport.setAttribute('content', `${previous}, viewport-fit=cover`);
        return () => viewport.setAttribute('content', previous);
    }, []);
};

export const BYOEMobile = ({ layout, redirect, initialSearchParams }: Props) => {
    useExtendIntoSafeAreas();

    return layout(
        <div className="mobile-settings byoe-mobile">
            <EasySwitchStoreProvider>
                <EasySwitchStoreInitializer>
                    <BYOEMobileProvider redirect={redirect} initialSearchParams={initialSearchParams}>
                        <BYOEMobileContent />
                    </BYOEMobileProvider>
                </EasySwitchStoreInitializer>
            </EasySwitchStoreProvider>
        </div>,
        { className: 'overflow-auto' }
    );
};
