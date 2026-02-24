import { c } from 'ttag';

import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons/types';

import LumoCatPlusCollarInline from '../../components/Icons/LumoCatPlusCollarInline';
import LumoPlusLogoInline from '../../components/Icons/LumoPlusLogoInline';

interface LumoCharacteristic {
    icon: IconName;
    getText: () => string;
}

const lumoCharacteristics: LumoCharacteristic[] = [
    {
        icon: 'speech-bubble',
        getText: () => c('collider_2025: Characteristic').t`Unlimited daily chats`,
    },
    {
        icon: 'arrow-up-line',
        getText: () => c('collider_2025: Characteristic').t`Multiple large uploads`,
    },
    {
        icon: 'clock-rotate-left',
        getText: () => c('collider_2025: Characteristic').t`Extended chat history`,
    },
    {
        icon: 'tag',
        getText: () => c('collider_2025: Characteristic').t`Priority access`,
    },
    {
        icon: 'folder',
        getText: () => c('collider_2025: Characteristic').t`Unlimited projects`,
    },
];

interface SubscriptionPanelProps {
    children: React.ReactNode;
    logo?: React.ReactNode;
    message?: string;
}

// Shared component
export const SubscriptionPanel = ({ message, children, logo }: SubscriptionPanelProps) => (
    <div
        className={
            'settings-modal-panel w-full flex flex-row gap-6 p-6 rounded-lg lumo-plus-settings-gradient border border-weak flex-nowrap flex-auto overflow-y-auto'
        }
    >
        {/* Left side - Content */}
        <div className="flex flex-column flex-nowrap gap-4 flex-1 w-1/2 *:min-size-auto">
            {/* Header */}
            <div className="flex items-center gap-2">{logo || <LumoPlusLogoInline height="20px" />}</div>

            {/* Subscription status message */}
            {message && (
                <div className="flex flex-column gap-1">
                    <p className="text-sm m-0">{message}</p>
                </div>
            )}

            {/* Features list */}
            <ul className="unstyled m-0 flex flex-column gap-2">
                {lumoCharacteristics.map((characteristic) => (
                    <li key={characteristic.getText()} className="flex items-center gap-3">
                        <Icon className="color-norm shrink-0" name={characteristic.icon} size={4} />
                        <span className="text-sm color-norm">{characteristic.getText()}</span>
                    </li>
                ))}
            </ul>

            {/* Action area - button or message */}
            <div className="mt-0 md:mt-2 w-fit-content">{children}</div>
        </div>

        {/* Right side - Lumo cat illustration */}
        <div className="flex items-end justify-end shrink-0 w-1/2">
            <LumoCatPlusCollarInline style={{ width: '80%', height: 'auto' }} />
        </div>
    </div>
);
