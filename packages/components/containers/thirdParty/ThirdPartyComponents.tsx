import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useZoomOAuth } from '@proton/calendar';
import Badge from '@proton/components/components/badge/Badge';
import Icon from '@proton/components/components/icon/Icon';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import ZoomUpsellModal from '@proton/components/components/upsell/modals/ZoomUpsellModal';
import ZoomLogo from '@proton/styles/assets/img/brand/zoom.svg';

import { SupportedProviders } from './interface';

export const ProviderIcon = ({ provider }: { provider: SupportedProviders }) => {
    if (provider === SupportedProviders.zoom) {
        return (
            <div className="flex items-center gap-2">
                <img src={ZoomLogo} alt="" className="h-6 w-6" />
                <p className="p-0 m-0">{c('Service provider').t`Zoom`}</p>
            </div>
        );
    }

    return <span />;
};

export const ProviderReason = ({ provider }: { provider: SupportedProviders }) => {
    if (provider === SupportedProviders.zoom) {
        return (
            <p className="p-0 m-0">{c('Service provider')
                .t`Allows you to add a Zoom video conference to any of your calendar events`}</p>
        );
    }

    return <span />;
};

export const ProviderAction = ({ provider, connected }: { provider: SupportedProviders; connected?: boolean }) => {
    const [user] = useUser();

    const { triggerZoomOAuth } = useZoomOAuth();
    const zoomUpsellModal = useModalStateObject();

    if (provider === SupportedProviders.zoom) {
        if (connected) {
            return <Badge type="success">{c('Action').t`Connected`}</Badge>;
        }

        if (!user.hasPaidMail && !connected) {
            return (
                <>
                    <Button size="small" onClick={() => zoomUpsellModal.openModal(true)} className="sm:ml-auto">
                        <Icon name="upgrade" className="mr-1" />
                        {c('Action').t`Connect`}
                    </Button>
                    {zoomUpsellModal.render && <ZoomUpsellModal modalProps={zoomUpsellModal.modalProps} />}
                </>
            );
        }

        return <Button size="small" onClick={() => triggerZoomOAuth()}>{c('Action').t`Connect`}</Button>;
    }

    return <span />;
};
