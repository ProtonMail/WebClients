import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Spotlight, Toggle } from '@proton/components';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../../constants';
import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { useGhostChat } from '../../../providers/GhostChatProvider';
import LumoPlusLogoInline from '../../components/LumoPlusLogoInline';

import './LumoPlusToggle.scss';

interface ToggleUpsellProps {
    onUpgrade?: () => void;
    className?: string;
}

const ToggleUpsell = ({ onUpgrade, className }: ToggleUpsellProps) => {
    const [showSpotlight, setShowSpotlight] = useState(false);
    // const [showModal, setShowModal] = useState(false);
    const { isSmallScreen } = useIsLumoSmallScreen();
    // const guestPlusUpsellModal = useModalStateObject();
    const { isGhostChatMode } = useGhostChat();

    if (!onUpgrade) return null;

    const spotlightContent = (
        <div className="text-sm">
            <LumoPlusLogoInline height="24px" className="mb-2" />
            <p className="m-0 color-weak">
                {c('collider_2025: Info')
                    .t`${LUMO_SHORT_APP_NAME} provide access to advanced models to help with more complex queries and provide better answers`}
            </p>
        </div>
    );

    // Don't show anything on small screens
    if (isSmallScreen) {
        return null;
    }

    return (
        <>
            <Spotlight
                show={showSpotlight && !isSmallScreen}
                content={spotlightContent}
                onClose={() => setShowSpotlight(false)}
                originalPlacement="bottom"
                hasClose={false}
                borderRadius="lg"
                className="border-none bg-norm"
            >
                <div
                    onMouseEnter={() => !isSmallScreen && setShowSpotlight(true)}
                    onMouseLeave={() => setShowSpotlight(false)}
                    className="inline-block flex flex-nowrap items-center gap-2"
                >
                    <LumoPlusLogoInline height="16px" />
                    <Toggle
                        id="lumo-plus-toggle"
                        checked={false}
                        onChange={onUpgrade}
                        className={clsx('lumo-plus-toggle', LUMO_UPGRADE_TRIGGER_CLASS, className, {
                            'ghost-mode': isGhostChatMode,
                        })}
                    />
                </div>
            </Spotlight>
        </>
    );
};

ToggleUpsell.displayName = 'ToggleUpsell';

export default ToggleUpsell;
