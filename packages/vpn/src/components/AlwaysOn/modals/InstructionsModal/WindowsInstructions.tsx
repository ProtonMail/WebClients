import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcUsersMerge } from '@proton/icons/icons/IcUsersMerge';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
// TODO: VPNB2B-164
import jumpcloud from '@proton/styles/assets/img/illustrations/vpn/always-on/jumpcloud.svg';
import windowsIcon from '@proton/styles/assets/img/illustrations/vpn/always-on/windows-colored.svg';

import type { AlwaysOnPolicyArtifact } from '../../../../types/AlwaysOn';
import { DeploymentMethodBody, DeploymentMethodHeader } from './DeploymentMethod';
import { MdmProviderButton } from './MdmProviderButton';
import { PlatformInstructions } from './PlatformInstructions';

const WINDOWS_SCRIPT_FILENAME = 'protonvpn-deviceprofile.ps1';
const REGO_FILENAME = 'protonvpn-deviceprofile.rego';

const policiesPath = <strong key="policies-path">{'C:\\Program Files\\Proton\\VPN\\Policies'}</strong>;

interface Props {
    /** The Windows installer artifact generated for the policy — its filename and content are offered for download. */
    windows?: AlwaysOnPolicyArtifact;
    /** The `.rego` device profile — its filename and content are offered for download. */
    rego?: AlwaysOnPolicyArtifact;
}

export const WindowsInstructions = ({ windows, rego }: Props) => {
    const intro = c('Info')
        .jt`To enable Always-on VPN, the device profile needs to reach ${policiesPath} on every device — the ${VPN_APP_NAME} client detects it there and enforces the profile automatically.`;

    const powershellArtifact = (
        <Href
            key="ps1"
            onClick={(event) => {
                event.preventDefault();
                if (windows) {
                    downloadFile(new Blob([windows.Content], { type: 'text/plain' }), windows.Filename);
                }
            }}
        >
            {windows?.Filename ?? WINDOWS_SCRIPT_FILENAME}
        </Href>
    );
    const regoArtifact = (
        <Href
            key="rego"
            onClick={(event) => {
                event.preventDefault();
                if (rego) {
                    downloadFile(new Blob([rego.Content], { type: 'text/plain' }), rego.Filename);
                }
            }}
        >
            {rego?.Filename ?? REGO_FILENAME}
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
                    <span>{c('Info').t`Choose one:`}</span>
                    <ul className="m-0 flex flex-column gap-2">
                        <li>{c('Info').jt`Deploy ${regoArtifact} directly via your MDM file deployment`}</li>
                        <li>{c('Info').jt`Or run ${powershellArtifact} via your MDM script execution`}</li>
                    </ul>

                    <div className="flex flex-row gap-2">
                        <MdmProviderButton
                            name={c('Action').t`Microsoft Intune`}
                            href={getKnowledgeBaseUrl('/business-mdm-intune-windows')}
                            icon={<img src={windowsIcon} className="shrink-0" alt="" />}
                        />
                        <MdmProviderButton
                            name={c('Action').t`JumpCloud`}
                            href="#"
                            icon={<img src={jumpcloud} className="shrink-0" alt="" />}
                        />
                    </div>

                    <span className="color-weak text-sm">
                        {c('Info')
                            .t`Using a different MDM? Any MDM that supports deploying files or executing PowerShell scripts will work. Refer to your MDM's documentation for further information.`}
                    </span>
                </DeploymentMethodBody>
            </Collapsible>

            <Collapsible key="powershell" className="border rounded-lg">
                <DeploymentMethodHeader
                    icon={<IcFileArrowInUp className="color-hint" />}
                    title={c('Title').t`Deploy via PowerShell`}
                />
                <DeploymentMethodBody>
                    <span className="color-weak">
                        {c('Info')
                            .jt`Download ${powershellArtifact} and run on each device as the system user to automatically place the device profile.`}
                    </span>
                </DeploymentMethodBody>
            </Collapsible>
        </PlatformInstructions>
    );
};
