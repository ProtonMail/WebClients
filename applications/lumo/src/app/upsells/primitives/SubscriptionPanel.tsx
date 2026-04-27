import { c } from 'ttag';

import { Icon } from '@proton/components';
import type { IconName } from '@proton/icons/types';

import LumoCatPlusCollarInline from '../../components/Icons/LumoCatPlusCollarInline';
import LumoPlusLogoInline from '../../components/Icons/LumoPlusLogoInline';

import './SubscriptionPanel.scss';

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
            'lumo-subscription-panel settings-modal-panel w-full lumo-plus-settings-gradient border border-weak overflow-y-auto'
        }
    >
        <div className="lumo-subscription-panel__body">
            <div className="lumo-subscription-panel__intro">
                <div className="lumo-subscription-panel__brand">
                    {logo || <LumoPlusLogoInline height="22px" />}
                </div>

                {message && <p className="lumo-subscription-panel__message">{message}</p>}
            </div>

            <ul className="lumo-subscription-panel__features">
                {lumoCharacteristics.map((characteristic) => (
                    <li key={characteristic.getText()}>
                        <Icon
                            className="lumo-subscription-panel__feature-icon color-norm"
                            name={characteristic.icon}
                            size={4}
                        />
                        <span className="lumo-subscription-panel__feature-text color-norm">
                            {characteristic.getText()}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="lumo-subscription-panel__cta mt-0 md:mt-1 w-fit">{children}</div>
        </div>

        <div className="lumo-subscription-panel__illustration flex items-end justify-end">
            <LumoCatPlusCollarInline className="lumo-subscription-panel__cat" />
        </div>
    </div>
);
