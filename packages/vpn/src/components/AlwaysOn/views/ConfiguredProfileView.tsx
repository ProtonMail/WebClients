import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    BorderedContainer,
    BorderedContainerItem,
} from '@proton/components/components/BorderedStackedGroup/BorderedContainer';
import { IcDevices } from '@proton/icons/icons/IcDevices';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcInfinite } from '@proton/icons/icons/IcInfinite';
import { IcPassword } from '@proton/icons/icons/IcPassword';

import type { AlwaysOnPolicy } from '../../../types/AlwaysOn';
import { ProfileActionsDropdown } from './ProfileActionsDropdown';

interface PolicyRowProps {
    icon: ReactNode;
    label: string;
    value: string;
}

const PolicyRow = ({ icon, label, value }: PolicyRowProps) => (
    <BorderedContainerItem className="flex flex-row items-center gap-2" paddingClassName="py-4">
        {icon}
        <span className="flex-1 text-lg">{label}</span>
        <span className="text-semibold text-lg">{value}</span>
    </BorderedContainerItem>
);

interface Props {
    policy: AlwaysOnPolicy;
    onShowInstructions: () => void;
    onReconfigure: () => void;
    onRemove: () => void;
}

export const ConfiguredProfileView = ({ policy, onShowInstructions, onReconfigure, onRemove }: Props) => (
    <div className="flex flex-column gap-6" style={{ maxWidth: '720px' }}>
        <Card className="rounded-xxl p-2" bordered={false} padded={false}>
            <div className="flex flex-row items-start gap-2 p-4">
                <div className="flex-1 flex flex-column gap-2">
                    <h2 className="text-semibold text-xl">{c('Title').t`Always-on VPN device profile`}</h2>
                    <div className="flex flex-row items-center gap-2">
                        <span className="text-lg color-weak">{c('Label').t`Applies:`}</span>
                        <Tooltip
                            title={c('Tooltip')
                                .t`Includes all users in your organization. Enforced only on devices where the Always-on VPN device profile has been deployed.`}
                        >
                            <span className="flex flex-row items-center flex-nowrap gap-2 color-weak hover:color-norm cursor-pointer">
                                <IcDevices className="shrink-0" />
                                <span className="text-semibold border-bottom border-dashed">{c('Info')
                                    .t`All devices with this device profile deployed`}</span>
                            </span>
                        </Tooltip>
                    </div>
                </div>
                <ProfileActionsDropdown onReconfigure={onReconfigure} onRemove={onRemove} />
            </div>

            <BorderedContainer className="bg-norm px-4 shadow-norm">
                <PolicyRow
                    icon={<IcInfinite size={6} className="color-weak" />}
                    label={c('Label').t`Enforce Always-on VPN`}
                    value={policy.EnforceAlwaysOn ? c('State').t`Enabled` : c('State').t`Disabled`}
                />
                <PolicyRow
                    icon={<IcPassword size={6} className="color-weak" />}
                    label={c('Label').t`Login restrictions`}
                    value={
                        policy.RestrictLogins
                            ? c('State').t`Restricted to members of your organization`
                            : c('State').t`No restrictions`
                    }
                />
            </BorderedContainer>
        </Card>

        <div className="flex flex-row flex-nowrap items-start justify-space-between gap-6">
            <div className="flex flex-column gap-1">
                <span className="text-semibold">{c('Title').t`Deploy device profile to your devices`}</span>
                <span className="color-weak">
                    {c('Info')
                        .t`Once successfully deployed, it may take up to a few hours for devices to detect and enforce the policy.`}
                </span>
            </div>
            <Button onClick={onShowInstructions} className="flex flex-row shrink-0 flex-nowrap gap-2 items-center">
                <IcFileLines className="shrink-0" />
                {c('Action').t`Instructions`}
            </Button>
        </div>
    </div>
);
