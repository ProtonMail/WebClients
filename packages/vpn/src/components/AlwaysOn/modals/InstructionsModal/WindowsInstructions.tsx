import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcUsersMerge } from '@proton/icons/icons/IcUsersMerge';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useAlwaysOnPolicyTelemetry } from '../../../../hooks/useAlwaysOnPolicyTelemetry';
import { useAlwaysOnWindowsRelease } from '../../../../hooks/useAlwaysOnWindowsRelease';
import { WINDOWS_DOWNLOAD_PAGE, useWindowsDownloadLinks } from '../../../../hooks/useWindowsDownloadLinks';
import type { AlwaysOnPolicyArtifact } from '../../../../types/AlwaysOn';
import { DeploymentMethodBody, DeploymentMethodHeader } from './DeploymentMethod';
import { Instructions } from './Instructions';
import { MinimumClientVersion } from './MinimumClientVersion';

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
    const minimumVersion = useAlwaysOnWindowsRelease();
    const downloadLinks = useWindowsDownloadLinks(minimumVersion);
    const { sendLearnMoreClickedReport } = useAlwaysOnPolicyTelemetry();

    const learnMore = (
        <Href
            key="learn-more"
            href={getKnowledgeBaseUrl('/mdm-always-on-vpn')}
            onClick={() => sendLearnMoreClickedReport('windows')}
        >{c('Link').t`Learn more`}</Href>
    );

    // translator: example: "To enable Always-on VPN, the device profile needs to reach C:\Program Files\Proton\VPN\Policies on every device — the Proton VPN client detects it there and enforces the profile automatically. Learn more."
    const intro = c('Info')
        .jt`To enable Always-on VPN, the device profile needs to reach ${policiesPath} on every device — the ${VPN_APP_NAME} client detects it there and enforces the profile automatically. ${learnMore}.`;

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
        <Instructions.Root>
            <Instructions.Intro>{intro}</Instructions.Intro>
            {minimumVersion && (
                <Instructions.Notice>
                    <MinimumClientVersion
                        version={minimumVersion}
                        links={downloadLinks}
                        downloadPage={WINDOWS_DOWNLOAD_PAGE}
                    />
                </Instructions.Notice>
            )}
            <Instructions.Methods>
                <Collapsible key="mdm" className="border rounded-lg">
                    <DeploymentMethodHeader
                        icon={<IcUsersMerge className="color-hint" />}
                        title={c('Title').t`Deploy via MDM`}
                        recommended
                    />
                    <DeploymentMethodBody>
                        <span>{c('Info').t`Choose one:`}</span>
                        <ul className="m-0 flex flex-column gap-2">
                            <li>
                                {
                                    // translator: example: "Deploy protonvpn-deviceprofile.rego directly via your MDM file deployment"
                                    c('Info').jt`Deploy ${regoArtifact} directly via your MDM file deployment`
                                }
                            </li>
                            <li>
                                {
                                    // translator: example: "Or run protonvpn-deviceprofile.ps1 via your MDM script execution"
                                    c('Info').jt`Or run ${powershellArtifact} via your MDM script execution`
                                }
                            </li>
                        </ul>
                    </DeploymentMethodBody>
                </Collapsible>

                <Collapsible key="powershell" className="border rounded-lg">
                    <DeploymentMethodHeader
                        icon={<IcFileArrowInUp className="color-hint" />}
                        title={c('Title').t`Deploy via PowerShell`}
                    />
                    <DeploymentMethodBody>
                        <span className="color-weak">
                            {
                                // translator: example: "Download protonvpn-deviceprofile.ps1 and run on each device as the system user to automatically place the device profile."
                                c('Info')
                                    .jt`Download ${powershellArtifact} and run on each device as the system user to automatically place the device profile.`
                            }
                        </span>
                    </DeploymentMethodBody>
                </Collapsible>
            </Instructions.Methods>
        </Instructions.Root>
    );
};
