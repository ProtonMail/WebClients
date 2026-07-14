import { c } from 'ttag';

import { Badge, Checkbox } from '@proton/components/index';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import illustration from '@proton/styles/assets/img/illustrations/vpn/always-on/always-on-vpn-configuration.svg';

interface ConfigurationFormProps {
    restrictLogins: boolean;
    onRestrictLoginsChange: (restrictLogins: boolean) => void;
}

export const ConfigurationForm = ({ restrictLogins, onRestrictLoginsChange }: ConfigurationFormProps) => {
    const steps = [
        c('Info').t`Generate the device profile and download a configuration file.`,
        c('Info').t`Deploy it through your MDM (Jamf, Intune…) or manually on each device.`,
        c('Info').t`Enforcement starts automatically as soon as the device detects the profile.`,
    ];

    return (
        <div>
            <div className="flex flex-column gap-3">
                <img src={illustration} className="shrink-0" alt="" />
                <div />
                <span>{c('Info')
                    .t`Devices that have Always-on VPN device profile deployed can't reach the internet unless a ${VPN_APP_NAME} connection is active.`}</span>

                <div className="flex flex-column gap-3">
                    {steps.map((description, index) => (
                        <div key={description} className="flex flex-row gap-2 flex-nowrap">
                            <Badge type="light" className="text-bold text-tabular-nums h-fit-content">
                                {index + 1}
                            </Badge>
                            <span>{description}</span>
                        </div>
                    ))}
                </div>

                <hr className="spaced weak" />
                <div className="flex flex-column gap-3">
                    <span className="color-weak">{c('Info').t`Optional configuration`}</span>
                    <div className="flex flex-row flex-nowrap gap-2 items-start">
                        <Checkbox
                            id="restrict-logins"
                            className="shrink-0"
                            checked={restrictLogins}
                            onChange={({ target }) => onRestrictLoginsChange(target.checked)}
                        />
                        <div className="flex flex-column gap-1">
                            <label htmlFor="restrict-logins" className="text-semibold">
                                {c('Info').t`Restrict logins to your organization`}
                            </label>
                            <span className="color-weak text-sm">{c('Info')
                                .t`Only licensed users of your organization can authenticate ${VPN_APP_NAME} on devices which have the device profile deployed.`}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
