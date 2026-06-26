import { c } from 'ttag';

import { BRAND_NAME, LUMO_SHORT_APP_NAME, LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { LUMO_SIGNUP_PATH, LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoPlan } from '../../providers/LumoPlanProvider';
import BasicUpgradeButton from '../primitives/BasicUpgradeButton';
import GetLumoBusinessButton from '../primitives/GetLumoBusinessButton';
import GetProtonWorkspaceButton from '../primitives/GetProtonWorkspaceButton';
import type { PlanFeature } from '../primitives/PlanCard';
import { PlanCard } from '../primitives/PlanCard';
import { openLumoUpsellModal } from '../providers/LumoUpsellModalProvider';

import './LumoSettingsUpsellSection.scss';

const plusFeatures: PlanFeature[] = [
    { icon: 'speech-bubble', getText: () => c('collider_2025: Characteristic').t`Unlimited daily chats` },
    { icon: 'folder', getText: () => c('collider_2025: Characteristic').t`Unlimited projects` },
    { icon: 'arrow-up-line', getText: () => c('collider_2025: Characteristic').t`Multiple large uploads` },
    { icon: 'tag', getText: () => c('collider_2025: Characteristic').t`Priority access` },
    { icon: 'clock-rotate-left', getText: () => c('collider_2025: Characteristic').t`Extended chat history` },
];

// Abbreviated for guest/free view where Business is the secondary card
const businessFeaturesShort: PlanFeature[] = [
    { icon: 'arrows-from-center', getText: () => c('collider_2025: Characteristic').t`Everything in Plus` },
    { icon: 'users', getText: () => c('collider_2025: Characteristic').t`User management` },
    { icon: 'chip', getText: () => c('collider_2025: Characteristic').t`Advanced AI models` },
];

// Full list for Plus view where Business is the primary card
const businessFeaturesFull: PlanFeature[] = [
    { icon: 'speech-bubble', getText: () => c('collider_2025: Characteristic').t`Unlimited daily chats` },
    { icon: 'folder', getText: () => c('collider_2025: Characteristic').t`Unlimited projects` },
    { icon: 'arrow-up-line', getText: () => c('collider_2025: Characteristic').t`Multiple large uploads` },
    { icon: 'tag', getText: () => c('collider_2025: Characteristic').t`Priority access` },
    { icon: 'clock-rotate-left', getText: () => c('collider_2025: Characteristic').t`Extended chat history` },
];

const workspaceFeatures: PlanFeature[] = [
    { icon: 'arrows-from-center', getText: () => c('collider_2025: Characteristic').t`Everything in Business` },
    { icon: 'archive-box', getText: () => c('collider_2025: Characteristic').t`1 TB cloud storage` },
    { icon: 'shield-half-filled', getText: () => c('collider_2025: Characteristic').t`VPN connections` },
    { icon: 'key', getText: () => c('collider_2025: Characteristic').t`Password manager` },
    { icon: 'camera', getText: () => c('collider_2025: Characteristic').t`Video meetings` },
    { icon: 'dots', getText: () => c('collider_2025: Characteristic').t`And much more` },
];

const PlusCard = ({ isGuest }: { isGuest: boolean }) => {
    const onUpgrade = isGuest ? undefined : () => openLumoUpsellModal(LUMO_UPSELL_PATHS.SETTINGS_MODAL_PLAN);

    return (
        <PlanCard planName={c('collider_2025: Plan Name').t`Plus`} features={plusFeatures}>
            <BasicUpgradeButton
                path={isGuest ? LUMO_SIGNUP_PATH : undefined}
                onClick={onUpgrade}
                buttonText={c('collider_2025: Upsell Title').t`Get ${LUMO_SHORT_APP_NAME} Plus`}
                className="w-full"
            />
        </PlanCard>
    );
};

// View for guests and authenticated free users: Plus + Business (short)
const FreeTierUpsell = ({ isGuest }: { isGuest: boolean }) => (
    <div className={`lumo-settings-upsell-section ${LUMO_UPGRADE_TRIGGER_CLASS}`}>
        <h2 className="text-lg text-bold mb-4">{c('collider_2025: Upsell Title').t`Elevate your AI experience`}</h2>
        <div className="flex flex-row flex-nowrap gap-3">
            <PlusCard isGuest={isGuest} />
            <PlanCard planName={c('collider_2025: Plan Name').t`Business`} features={businessFeaturesShort}>
                <GetLumoBusinessButton />
            </PlanCard>
        </div>
    </div>
);

// View for Plus / Visionary users: Business (full) + Workspace
const PlusTierUpsell = () => (
    <div className={`lumo-settings-upsell-section ${LUMO_UPGRADE_TRIGGER_CLASS}`}>
        <h2 className="text-lg text-bold mb-4">
            {c('collider_2025: Upsell Title').t`Elevate your business AI experience`}
        </h2>
        <div className="flex flex-row flex-nowrap gap-3">
            <PlanCard planName={c('collider_2025: Plan Name').t`Business`} features={businessFeaturesFull}>
                <GetLumoBusinessButton />
            </PlanCard>
            <PlanCard planName={c('collider_2025: Plan Name').t`${BRAND_NAME} Workspace`} features={workspaceFeatures}>
                <GetProtonWorkspaceButton />
            </PlanCard>
        </div>
    </div>
);

export const LumoSettingsUpsellSection = () => {
    const isGuest = useIsGuest();
    const { hasLumoSeat, isVisionary, hasLumoB2B, userIsMember } = useLumoPlan();

    if (hasLumoB2B || userIsMember) {
        return null;
    }

    if (hasLumoSeat || isVisionary) {
        return <PlusTierUpsell />;
    }

    return <FreeTierUpsell isGuest={isGuest} />;
};

LumoSettingsUpsellSection.displayName = 'LumoSettingsUpsellSection';
