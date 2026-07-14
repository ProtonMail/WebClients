import { c } from 'ttag';

// import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { Pill } from '@proton/atoms/Pill/Pill';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import { CollapsibleGroup } from '@proton/components/components/collapsible/CollapsibleGroup';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
// import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcUsersMerge } from '@proton/icons/icons/IcUsersMerge';
import { IcWindowTerminal } from '@proton/icons/icons/IcWindowTerminal';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

// TODO: VPNB2B-164
// import jumpcloud from '@proton/styles/assets/img/illustrations/vpn/always-on/jumpcloud.svg';
// import windows from '@proton/styles/assets/img/illustrations/vpn/always-on/windows-colored.svg';

import type { AlwaysOnPolicyArtifact } from '../../../../types/AlwaysOn';

const WINDOWS_SCRIPT_FILENAME = 'protonvpn-deviceprofile.ps1';
const REGO_FILENAME = 'protonvpn-deviceprofile.rego';

const policiesPath = <strong key="policies-path">{'C:\\Program Files\\Proton\\VPN\\Policies'}</strong>;

const chevron = (
    <CollapsibleHeaderIconButton shape="ghost" className="p-0">
        <IcChevronDown />
    </CollapsibleHeaderIconButton>
);

interface Props {
    /** The Windows installer artifact generated for the policy — its filename and content are offered for download. */
    windows?: AlwaysOnPolicyArtifact;
    /** The `.rego` device profile — its filename and content are offered for download. */
    rego?: AlwaysOnPolicyArtifact;
}

/** Deployment instructions, shared between the standalone modal and the configure flow's final step. */
export const InstructionsContent = ({ windows, rego }: Props) => {
    const ps1Link = (
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

    const regoLink = (
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
        <div className="flex flex-column gap-4">
            <p className="m-0">
                {c('Info')
                    .jt`To enable Always-on VPN, the device profile needs to reach ${policiesPath} on every device — the ${VPN_APP_NAME} client detects it there and enforces the profile automatically.`}
            </p>

            <h3 className="text-semibold">{c('Title').t`Choose a deployment method`}</h3>

            {/* Single-open accordion (only one method expanded at a time), MDM open by default. */}
            <CollapsibleGroup defaultValue="mdm">
                <Collapsible key="mdm" className="border rounded-lg">
                    <CollapsibleHeader
                        className="p-4"
                        prefix={<IcUsersMerge className="color-hint" />}
                        suffix={chevron}
                    >
                        <div className="flex flex-row items-center gap-2">
                            <span className="text-semibold flex-1">{c('Title').t`Deploy via MDM`}</span>
                            <Pill rounded="rounded-sm">
                                <span className="text-sm text-semibold color-primary">{c('Info').t`RECOMMENDED`}</span>
                            </Pill>
                        </div>
                    </CollapsibleHeader>
                    <CollapsibleContent animated>
                        <div className="flex flex-column gap-3 pl-10 pr-4 pb-4">
                            <span>{c('Info').t`Choose one:`}</span>
                            <ul className="m-0 flex flex-column gap-2">
                                <li>{c('Info').jt`Deploy ${regoLink} directly via your MDM file deployment`}</li>
                                <li>{c('Info').jt`Or run ${ps1Link} via your MDM script execution`}</li>
                            </ul>

                            {/* // TODO: VPNB2B-164
                            <div className="flex flex-row gap-2">
                                <ButtonLike
                                    as={Href}
                                    href="#"
                                    className="text-semibold flex flex-row shrink-0 gap-2 items-center"
                                >
                                    <img src={windows} className="shrink-0" alt="" />
                                    {c('Action').t`Microsoft Intune`}
                                    <IcArrowOutSquare className="color-hint" />
                                </ButtonLike>
                                <ButtonLike
                                    as={Href}
                                    href="#"
                                    className="text-semibold flex flex-row shrink-0 gap-2 items-center"
                                >
                                    <img src={jumpcloud} className="shrink-0" alt="" />
                                    {c('Action').t`JumpCloud`}
                                    <IcArrowOutSquare className="color-hint" />
                                </ButtonLike>
                            </div> */}

                            <span className="color-weak">
                                {c('Info')
                                    .t`Using a different MDM? Any MDM that supports deploying files or executing PowerShell scripts will work. Refer to your MDM's documentation for further information.`}
                            </span>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <Collapsible key="powershell" className="border rounded-lg">
                    <CollapsibleHeader
                        className="p-4"
                        prefix={<IcWindowTerminal className="color-hint" />}
                        suffix={chevron}
                    >
                        <span className="text-semibold">{c('Title').t`Deploy via PowerShell`}</span>
                    </CollapsibleHeader>
                    <CollapsibleContent animated>
                        <div className="flex flex-column gap-3 pl-10 pr-4 pb-4">
                            <span className="color-weak">
                                {c('Info')
                                    .jt`Download ${ps1Link} and run on each device as the system user to automatically place the device profile.`}
                            </span>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CollapsibleGroup>
        </div>
    );
};
