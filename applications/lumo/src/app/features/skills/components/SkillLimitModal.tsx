import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoPlusLimitModal } from '../../../components/Modals/LumoPlusLimitModal';
import { SKILL_TIER_LIMITS } from '../skillEntitlements';
import type { SkillLimitModalState } from '../useSkillLimit';

interface SkillLimitModalProps extends ModalProps, SkillLimitModalState {
    isConvertingToPlugin?: boolean;
    isUploadingPlugin?: boolean;
}

const getLimitText = (maxActiveSkills: number) =>
    c('collider_2025:Info').ngettext(
        msgid`Your current plan includes up to ${maxActiveSkills} skill turned on at once.`,
        `Your current plan includes up to ${maxActiveSkills} skills turned on at once.`,
        maxActiveSkills
    );

export const SkillLimitModal = ({
    block,
    maxActiveSkills,
    upgradePath,
    isConvertingToPlugin = false,
    isUploadingPlugin = false,
    ...modalProps
}: SkillLimitModalProps) => {
    const plan = PLAN_NAMES[PLANS.LUMO];
    const plusLimit = SKILL_TIER_LIMITS.plus.maxActiveSkills;

    if (upgradePath !== 'checkout') {
        let title;
        let description;
        if (block === 'skill-sets') {
            // translator: Title shown when skill sets aren't included in the user's plan.
            title = c('collider_2025:Title').t`Skill sets aren't included in your plan`;
            description =
                upgradePath === 'admin'
                    ? c('collider_2025:Info')
                          .t`Ask your organization's administrator for a ${LUMO_SHORT_APP_NAME} seat to add skill sets.`
                    : c('collider_2025:Info').t`Skill sets can't be added on your current plan.`;
        } else {
            // translator: Title shown when the user has turned on as many skills as their plan allows.
            title = c('collider_2025:Title').t`You've reached your skill limit`;
            description =
                upgradePath === 'admin'
                    ? `${getLimitText(maxActiveSkills)} ${c('collider_2025:Info').t`Ask your organization's administrator for a ${LUMO_SHORT_APP_NAME} seat to turn on more.`}`
                    : `${getLimitText(maxActiveSkills)} ${c('collider_2025:Info').t`Turn some skills off to turn on others.`}`;
        }
        return (
            <ModalTwo {...modalProps} size="small">
                <ModalTwoHeader title={title} />
                <ModalTwoContent>
                    <p className="m-0 color-weak">{description}</p>
                </ModalTwoContent>
                <ModalTwoFooter className="justify-end">
                    <Button color="norm" onClick={modalProps.onClose}>{c('collider_2025:Action').t`Got it`}</Button>
                </ModalTwoFooter>
            </ModalTwo>
        );
    }

    let title;
    let description;
    if (block === 'skill-sets' && isConvertingToPlugin) {
        // translator: Title of the skill conversion modal.
        title = c('collider_2025:Title').t`Turn your skill into a skill set`;
        // translator: Shown when editing a standalone skill would turn it into a skill set. ${plan} is the paid plan name.
        description = c('collider_2025:Info')
            .t`This change turns your skill into a skill set. Skill sets aren't available on your current plan. Upgrade to ${plan} to save it.`;
    } else if (block === 'skill-sets' && isUploadingPlugin) {
        // translator: Title shown when a skill set upload requires a paid plan. ${plan} is the paid plan name.
        title = c('collider_2025:Title').t`Skill sets require ${plan}`;
        // translator: Shown when an uploaded file or folder contains a skill set that the user's plan does not allow. ${plan} is the paid plan name.
        description = c('collider_2025:Info')
            .t`You're uploading a skill set. Skill sets aren't available on your current plan. Upgrade to ${plan} to add it.`;
    } else if (block === 'skill-sets') {
        // translator: Title shown when adding or turning on a skill set requires a paid plan. ${plan} is the paid plan name.
        title = c('collider_2025:Title').t`Skill sets come with ${plan}`;
        // translator: ${plan} is the paid plan name.
        description = c('collider_2025:Info')
            .t`Skill sets bring several related skills together. They aren't available on your current plan. Upgrade to ${plan} to add them.`;
    } else {
        // translator: Title of the skill upgrade modal. ${plan} is the paid plan name.
        title = c('collider_2025:Title').t`Turn on more skills with ${plan}`;
        // translator: ${plusLimit} is how many skills the paid plan allows turned on at once. ${plan} is the paid plan name.
        description = `${getLimitText(maxActiveSkills)} ${c('collider_2025:Info').t`Upgrade to ${plan} to use up to ${plusLimit} skills and skill sets, unlock advanced AI models, and more.`}`;
    }
    // translator: Feature in the upgrade list. ${plusLimit} is how many skills the paid plan allows turned on at once.
    const limitFeature = c('collider_2025:Feature').t`Up to ${plusLimit} skills and skill sets`;

    return <LumoPlusLimitModal {...modalProps} title={title} description={description} limitFeature={limitFeature} />;
};
