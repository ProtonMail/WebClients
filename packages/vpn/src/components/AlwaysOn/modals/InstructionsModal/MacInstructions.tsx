import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcUsersMerge } from '@proton/icons/icons/IcUsersMerge';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import iru from '@proton/styles/assets/img/illustrations/vpn/always-on/iru.svg';
import jamfPro from '@proton/styles/assets/img/illustrations/vpn/always-on/jamf-pro.svg';
import omnissa from '@proton/styles/assets/img/illustrations/vpn/always-on/omnissa.svg';

import { DeploymentMethodBody, DeploymentMethodHeader } from './DeploymentMethod';
import { MdmProviderButton } from './MdmProviderButton';
import { PlatformInstructions } from './PlatformInstructions';

const MOBILECONFIG_FILENAME = 'protonvpn.mobileconfig';

// TODO: VPNB2B-164
const MAC_MDM_PROVIDERS = [
    { name: 'Jamf Pro', path: '#', icon: jamfPro },
    { name: 'Iru', path: '/how-to-configure-iru-kandji-mdm-to-use-proton-vpn', icon: iru },
    { name: 'Omnissa', path: '/mdm-workspace-one', icon: omnissa },
] as const;

export const MacInstructions = () => {
    const intro = c('Info')
        .t`To enable Always-on VPN, the configuration profile needs to be installed on every Mac — the ${VPN_APP_NAME} client enforces the device profile automatically once it is in place.`;

    // TODO: VPNB2B-182
    const mobileConfigArtifact = (
        <Href key="mobileconfig" onClick={(event) => event.preventDefault()}>
            {MOBILECONFIG_FILENAME}
        </Href>
    );

    return (
        <PlatformInstructions intro={intro}>
            <Collapsible key="mdm" className="border rounded-lg">
                <DeploymentMethodHeader
                    icon={<IcUsersMerge className="color-hint" />}
                    title={c('Title').t`Deploy via MDM`}
                    recommended
                />
                <DeploymentMethodBody>
                    <span>{c('Info').jt`Push ${mobileConfigArtifact} to every managed Mac using your MDM.`}</span>

                    <div className="flex flex-row flex-wrap gap-2">
                        {MAC_MDM_PROVIDERS.map(({ name, path, icon }) => (
                            <MdmProviderButton
                                key={name}
                                name={name}
                                href={getKnowledgeBaseUrl(path)}
                                icon={<img src={icon} className="shrink-0 rounded-sm" alt="" />}
                            />
                        ))}
                    </div>

                    <span className="color-weak text-sm">
                        {c('Info')
                            .t`Using a different MDM? Any MDM that supports deploying a configuration profile will work. Refer to your MDM's documentation on how to upload and assign it to your device fleet.`}
                    </span>
                </DeploymentMethodBody>
            </Collapsible>

            <Collapsible key="manual" className="border rounded-lg">
                <DeploymentMethodHeader
                    icon={<IcFileArrowInUp className="color-hint" />}
                    title={c('Title').t`Install it manually`}
                />
                <DeploymentMethodBody>
                    <span className="color-weak">
                        {c('Info')
                            .jt`Download ${mobileConfigArtifact} and open it on each Mac to install the profile, then approve it in System Settings.`}
                    </span>
                </DeploymentMethodBody>
            </Collapsible>
        </PlatformInstructions>
    );
};
