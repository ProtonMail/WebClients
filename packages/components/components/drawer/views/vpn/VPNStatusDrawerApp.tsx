import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import { getCountryOptions, getLocalizedCountryByAbbr } from '@proton/payments';
import { type ConnectionInformationResult } from '@proton/shared/lib/api/core/connection-information';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

import DrawerAppSection from '../shared/DrawerAppSection';

interface Props {
    connectionInformation: ConnectionInformationResult;
    userSettings: UserSettings;
}

const VPNStatusDrawerApp = ({ userSettings, connectionInformation }: Props) => {
    const countryOptions = getCountryOptions(userSettings);
    const countryName = getLocalizedCountryByAbbr(connectionInformation.CountryCode, countryOptions) || '';

    return (
        <DrawerAppSection className="sm:px-3 mb-2">
            {connectionInformation.IsVpnConnection ? (
                <div className="flex flex-column flex-nowrap gap-2 pb-0.5">
                    <div className="text-semibold text-sm color-success my-1 flex flex-nowrap items-start">
                        <span className="inline-flex vpn-view-status-protected shrink-0 ratio-square mr-1 relative">
                            <span className="flex vpn-view-status-protected-inner shrink-0 ratio-square rounded-full relative m-auto"></span>
                        </span>
                        <span className="flex-1">{c('Info').t`Your online activity is protected`}</span>
                    </div>

                    <div className="bg-weak rounded my-1 px-1 py-3 flex flex-row flex-nowrap gap-1">
                        <div className="flex-1 text-center">
                            <span className="text-sm block color-weak mb-0.5">{c('Info').t`Your IP`}</span>
                            <span className="text-semibold block">**.***.***.**</span>
                        </div>
                        <div className="shrink-0 flex">
                            <Icon name="arrow-right" className="my-auto" />
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-sm block color-weak mb-0.5">{c('Info').t`VPN IP`}</span>
                            <span className="text-semibold block">{connectionInformation.Ip}</span>
                        </div>
                    </div>

                    <p className="my-1 text-sm color-weak">{c('Info')
                        .t`${VPN_APP_NAME} is masking your IP address, so websites can’t identify you.`}</p>
                </div>
            ) : (
                <div className="flex flex-column flex-nowrap gap-2 pb-1">
                    <div className="text-sm mt-1 flex flex-nowrap items-start border-bottom border-weak pb-3">
                        <span className="inline-flex vpn-view-status-unprotected shrink-0 ratio-square mr-1 relative">
                            <span className="flex vpn-view-status-unprotected-inner shrink-0 ratio-square rounded-full relative m-auto"></span>
                        </span>
                        <span className="flex-1 color-danger text-semibold">{c('Info').t`Not connected`}</span>
                    </div>

                    <div className="flex flex-row justify-space-between items-center pt-1">
                        <div className="flex flex-row items-center">
                            <span className="text-sm mr-1">{c('Label').t`Your IP`}</span>
                            <Info
                                className="color-weak"
                                title={c('Info')
                                    .t`This unique code can be used by websites and ISPs (internet service providers) to link your location and browsing history to your device`}
                                tooltipClassName="tooltip--vpndrawer-larger"
                            />
                        </div>
                        <div className="text-semibold">{connectionInformation.Ip}</div>
                    </div>
                    <div className="flex flex-nowrap justify-space-between items-center">
                        <div className="flex flex-row flex-nowrap items-center">
                            <span className="text-sm mr-1">{c('Label').t`Your location`}</span>
                            <Info
                                className="color-weak"
                                title={c('Info')
                                    .t`Your physical location is visible and can be used to restrict your access to the internet.`}
                                tooltipClassName="tooltip--vpndrawer-larger"
                            />
                        </div>
                        <div className="flex flex-row flex-nowrap items-center">
                            <div className="text-semibold">{countryName}</div>
                        </div>
                    </div>
                    <div className="flex flex-row justify-space-between items-center pb-1">
                        <div className="flex flex-row items-center">
                            <span className="text-sm mr-1">{c('Label').t`Your ISP`}</span>
                            <Info
                                className="color-weak"
                                title={c('Info')
                                    .t`Your internet service provider can monitor and sometimes sell your data, or even restrict what websites you can access.`}
                                tooltipClassName="tooltip--vpndrawer-larger"
                            />
                        </div>
                        <div className="text-semibold">{connectionInformation.IspProvider}</div>
                    </div>

                    <p className="border-top border-weak my-0 pt-3 text-sm color-weak">{c('Info')
                        .t`Your IP address is visible and can be used to track your online activity.`}</p>
                </div>
            )}
        </DrawerAppSection>
    );
};

export default VPNStatusDrawerApp;
