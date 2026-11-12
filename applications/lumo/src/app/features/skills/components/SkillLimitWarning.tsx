import { c, msgid } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { SkillUpgradePath } from '../useSkillLimit';

interface SkillLimitWarningProps {
    isOverLimit: boolean;
    hasUnavailableSkillSets: boolean;
    activeSkillCount: number;
    maxActiveSkills: number;
    upgradePath: SkillUpgradePath;
    onUpgrade: () => void;
}

/** Shown when more skills are on than the plan allows, for example after a downgrade. */
export const SkillLimitWarning = ({
    isOverLimit,
    hasUnavailableSkillSets,
    activeSkillCount,
    maxActiveSkills,
    upgradePath,
    onUpgrade,
}: SkillLimitWarningProps) => {
    if (!isOverLimit && !hasUnavailableSkillSets) {
        return null;
    }

    const parts: string[] = [];
    if (isOverLimit) {
        // translator: ${activeSkillCount} skills are on; ${maxActiveSkills} is how many the plan allows.
        parts.push(
            c('collider_2025:Info').ngettext(
                msgid`${activeSkillCount} skill is turned on, but your plan includes ${maxActiveSkills}.`,
                `${activeSkillCount} skills are turned on, but your plan includes ${maxActiveSkills}.`,
                activeSkillCount
            )
        );
    }
    if (hasUnavailableSkillSets) {
        parts.push(c('collider_2025:Info').t`Skill sets aren't included in your plan.`);
    }
    if (upgradePath === 'admin') {
        parts.push(
            c('collider_2025:Info')
                .t`Turn some skills off before turning on others, or ask your administrator for a ${LUMO_SHORT_APP_NAME} seat.`
        );
    } else if (upgradePath === 'checkout') {
        parts.push(
            c('collider_2025:Info').t`Turn some skills off before turning on others, or upgrade to keep them all.`
        );
    } else {
        parts.push(c('collider_2025:Info').t`Turn some skills off before turning on others.`);
    }

    return (
        <Banner
            variant={BannerVariants.WARNING_OUTLINE}
            largeRadius
            action={
                upgradePath === 'checkout' ? (
                    <Button shape="solid" color="norm" size="small" onClick={onUpgrade}>
                        {
                            // translator: Plus is the paid plan name. Do not translate.
                            c('collider_2025:Action').t`Upgrade to Plus`
                        }
                    </Button>
                ) : undefined
            }
        >
            {parts.join(' ')}
        </Banner>
    );
};
