import { c } from 'ttag';

import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { useOAuthToken } from '@proton/activation/src/logic/oauthToken/hooks';
import { ButtonLikeSizeEnum } from '@proton/atoms/Button/ButtonLike';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { ProviderAction } from '@proton/components/containers/thirdParty/ThirdPartyComponents';
import { SupportedProviders } from '@proton/components/containers/thirdParty/interface';
import { CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import ZoomLogo from '@proton/styles/assets/img/brand/zoom.svg';

const ThirdPartyProvider = ({ provider }: { provider: SupportedProviders }) => {
    const [token, loading] = useOAuthToken();
    const hasZoom = !loading && token?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    if (provider === SupportedProviders.zoom) {
        return (
            <div className="flex justify-space-between items-center w-full">
                <div className="flex items-center gap-3">
                    <img src={ZoomLogo} alt="" className="h-6 w-6" />
                    <div className="flex flex-column">
                        <p className="p-0 m-0 text-semibold">{c('Service provider').t`Zoom`}</p>
                        <p className="p-0 m-0 color-weak">{c('Service provider').t`Add to ${CALENDAR_APP_NAME}`}</p>
                    </div>
                </div>
                <ProviderAction
                    provider={SupportedProviders.zoom}
                    connected={hasZoom}
                    buttonSize={ButtonLikeSizeEnum.Medium}
                />
            </div>
        );
    }

    return null;
};

export const ThirdPartySection = () => {
    return (
        <SettingsSectionWide className="mt-5">
            <div className="rounded-lg p-4 border border-weak flex gap-3 items-center">
                <ThirdPartyProvider provider={SupportedProviders.zoom} />
            </div>
        </SettingsSectionWide>
    );
};
