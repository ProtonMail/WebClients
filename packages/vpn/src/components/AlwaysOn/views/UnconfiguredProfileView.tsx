import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { IcCheckmarkStrong } from '@proton/icons/icons/IcCheckmarkStrong';
import { DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import illustration from '@proton/styles/assets/img/illustrations/vpn/always-on/always-on-vpn.svg';

import { useIsMacOSSupportEnabled } from '../../../contexts/AlwaysOnPolicyServiceContext';

interface Props {
    onConfigure: () => void;
}

export const UnconfiguredProfileView = ({ onConfigure }: Props) => {
    const isMacOSSupportEnabled = useIsMacOSSupportEnabled();
    const callouts = [
        c('Info').t`Employees can't go online without a VPN connection`,
        c('Info').t`All internet traffic is always encrypted and secure`,
        c('Info').t`Deploy across all your managed devices`,
    ];
    return (
        <Card className="rounded-xl py-8 px-6 md:p-12" bordered={false}>
            <div className="flex flex-column items-center gap-12">
                <img src={illustration} className="shrink-0" alt="" />
                <div className="flex flex-column gap-6 items-center">
                    <div>
                        <h2 className="text-4xl text-semibold">{c('Info')
                            .t`Ensure your organization is always protected`}</h2>
                    </div>

                    <div className="flex flex-column gap-2">
                        {callouts.map((callout) => (
                            <span className="flex flex-row gap-2 flex-nowrap" key={callout}>
                                <IcCheckmarkStrong className="color-primary shrink-0" />
                                {callout}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-column gap-4 items-center">
                        <Button color="norm" size="large" onClick={onConfigure}>{c('Info')
                            .t`Configure Always-on VPN`}</Button>
                        <div className="flex flex-row gap-1 items-center color-weak text-sm">
                            <span>{c('Info').t`Supported platforms`} </span>
                            <IcBrandWindows className="color-info" size={5} />
                            <span className="text-capitalize">{DESKTOP_PLATFORMS.WINDOWS}</span>
                            {isMacOSSupportEnabled && (
                                <>
                                    <IcBrandApple size={5} />
                                    <span>{c('Info').t`macOS`}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
