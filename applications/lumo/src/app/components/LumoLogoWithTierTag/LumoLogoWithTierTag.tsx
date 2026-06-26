import { useMemo } from 'react';

import { clsx } from 'clsx';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoLogov6Dark from '@proton/styles/assets/img/lumo/lumo-logo-v6-dark.svg';
import lumoLogov6 from '@proton/styles/assets/img/lumo/lumo-logo-v6.svg';

import { useLumoPlan } from '../../providers/LumoPlanProvider';
import { ThemeTypes, useLumoTheme } from '../../providers/LumoThemeProvider';

import './LumoLogoWithTierTag.scss';

export const LOGO_HEIGHT = '18px';

export type LumoTierTag = 'pro' | 'plus';

export const getLogoSrc = (theme: ThemeTypes) => {
    return theme === ThemeTypes.LumoDark ? lumoLogov6Dark : lumoLogov6;
};

export const getTierTag = (hasLumoB2B: boolean, hasLumoSeat: boolean): LumoTierTag | null => {
    if (hasLumoB2B) {
        return 'pro';
    }
    if (hasLumoSeat) {
        return 'plus';
    }
    return null;
};

const getAltText = (tierTag: LumoTierTag | null) => {
    if (tierTag === 'pro') {
        return `${LUMO_SHORT_APP_NAME} Business`;
    }
    if (tierTag === 'plus') {
        return `${LUMO_SHORT_APP_NAME} Plus`;
    }
    return LUMO_SHORT_APP_NAME;
};

interface LumoLogoWithTierTagProps {
    /** When set, overrides plan-derived tier. Pass `null` to hide the tag. */
    tierTag?: LumoTierTag | null;
    height?: string;
    className?: string;
    alt?: string;
}

export const LumoLogoWithTierTag = ({ tierTag, height = LOGO_HEIGHT, className, alt }: LumoLogoWithTierTagProps) => {
    const { theme } = useLumoTheme();
    const { hasLumoSeat, hasLumoB2B } = useLumoPlan();

    const logoSrc = useMemo(() => {
        return getLogoSrc(theme);
    }, [theme]);

    const resolvedTierTag = useMemo(() => {
        if (tierTag !== undefined) {
            return tierTag;
        }
        return getTierTag(hasLumoB2B, hasLumoSeat);
    }, [tierTag, hasLumoB2B, hasLumoSeat]);

    const resolvedAlt = alt ?? getAltText(resolvedTierTag);

    return (
        <div className={clsx('flex flex-row flex-nowrap items-center gap-2', className)}>
            <img src={logoSrc} alt={resolvedAlt} height={height} />
            {resolvedTierTag && (
                <span
                    className={clsx(
                        'tier-tag text-xs text-norm color-invert rounded-sm px-1 py-0.5 block',
                        resolvedTierTag === 'pro' ? 'pro' : 'plus'
                    )}
                >
                    {/* Do not translate these strings */}
                    {resolvedTierTag === 'pro' ? 'Pro' : 'Plus'}
                </span>
            )}
        </div>
    );
};
