import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { IcUsersMerge } from '@proton/icons/icons/IcUsersMerge';
import { IcWindowTerminal } from '@proton/icons/icons/IcWindowTerminal';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import type { AlwaysOnPolicyArtifact } from '../../../types/AlwaysOn';

const PROFILE_FILENAME = 'protonvpn-deviceprofile.rego';
const POLICIES_PATH = 'C:\\Program Files\\Proton\\VPN\\Policies';
const REMOVE_SCRIPT_FILENAME = 'protonvpn-deviceprofile-remove.ps1';

const profileFile = <strong key="profile-file">{PROFILE_FILENAME}</strong>;
const policiesPath = <strong key="policies-path">{POLICIES_PATH}</strong>;

interface Props extends ModalProps {
    /** The Windows uninstall artifact generated for the policy — its filename and content are offered for download. */
    windowsUninstall?: AlwaysOnPolicyArtifact;
}

export const RemoveProfileModal = ({ windowsUninstall, ...props }: Props) => {
    const removeScriptLink = (
        <Href
            key="remove-script"
            onClick={(event) => {
                event.preventDefault();
                if (windowsUninstall) {
                    downloadFile(
                        new Blob([windowsUninstall.Content], { type: 'text/plain' }),
                        windowsUninstall.Filename
                    );
                }
            }}
        >
            {windowsUninstall?.Filename ?? REMOVE_SCRIPT_FILENAME}
        </Href>
    );
    const methods = [
        {
            icon: <IcUsersMerge className="color-hint shrink-0 mt-0.5" />,
            tagline: c('Title').t`Remove via MDM`,
            brief: c('Info')
                .jt`Use your MDM to delete the file, or run ${removeScriptLink} via your MDM's script execution. Any MDM that supports deploying files or running scripts will work.`,
        },
        {
            icon: <IcWindowTerminal className="color-hint shrink-0 mt-0.5" />,
            tagline: c('Title').t`Remove via PowerShell`,
            brief: c('Info')
                .jt`Download ${removeScriptLink} and run it on each device as the system user to delete the profile automatically.`,
        },
    ];
    return (
        <ModalTwo {...props} size="large">
            <ModalTwoHeader title={c('Title').t`Remove Always-on VPN device profile`} />
            <ModalTwoContent>
                <div className="flex flex-column gap-6">
                    <span>
                        {c('Info')
                            .jt`To remove Always-on VPN, delete ${profileFile} from ${policiesPath} on every device. The ${VPN_APP_NAME} client stops enforcing the profile as soon as it detects the file is gone.`}
                    </span>
                    <div className="flex flex-column gap-4">
                        <h3 className="text-semibold text-rg m-0">{c('Title').t`Choose a removal method`}</h3>

                        {methods.map((method) => (
                            <div className="flex flex-row flex-nowrap gap-2 items-start" key={method.tagline}>
                                {method.icon}
                                <div className="flex flex-column gap-2">
                                    <span className="text-semibold">{method.tagline}</span>
                                    <span className="color-weak">{method.brief}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button color="norm" shape="solid" onClick={props.onClose}>
                    {c('Action').t`Got it`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
