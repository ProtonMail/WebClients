import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import createItemArrow from '@proton/pass/assets/create-item-arrow.png';
import onboardingImport from '@proton/pass/assets/onboarding-import.png';
import onboardingShare from '@proton/pass/assets/onboarding-share.png';
import onboardingVault from '@proton/pass/assets/onboarding-vault.png';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useInviteContext } from '@proton/pass/components/Invite/InviteProvider';
import type { OnboardingCardProps } from '@proton/pass/components/Layout/Card/OnboardingCard';
import { OnboardingCard } from '@proton/pass/components/Layout/Card/OnboardingCard';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { selectPassPlan } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { BRAND_NAME } from '@proton/shared/lib/constants';

type OnboardingCardType = Pick<OnboardingCardProps, 'imageSrc' | 'title' | 'description' | 'onClick'>;

export const ItemsListPlaceholderBusiness: FC = () => {
    const { openSettings } = usePassCore();

    const plan = useSelector(selectPassPlan);

    const vaultActions = useVaultActions();
    const inviteContext = useInviteContext();

    const onboardingCards = useMemo<OnboardingCardType[]>(
        () => [
            {
                imageSrc: onboardingImport,
                title: c('Title').t`Import your data`,
                description: c('Info').t`Bring your existing passwords into ${BRAND_NAME}.`,
                onClick: () => openSettings?.('import'),
            },
            {
                imageSrc: onboardingVault,
                title: c('Title').t`Create a vault`,
                description: c('Info').t`Get the most out of Pass by creating a vault for each team or project.`,
                onClick: vaultActions.create,
            },
            {
                imageSrc: onboardingShare,
                title: c('Title').t`Share vaults with your team`,
                description: c('Info').t`Invite specific people and set the right permissions.`,
                onClick: () => inviteContext.createSharedVault({ item: undefined }),
            },
        ],
        []
    );

    return (
        <div className="flex flex-column w-full w-2/3 max-w-custom gap-4" style={{ '--max-w-custom': '30rem' }}>
            <div className="absolute top-0 right-custom" style={{ '--right-custom': '24px' }}>
                <div className="relative flex flex-nowrap items-end">
                    <div className="border px-8 py-2 rounded rounded-full border-primary mt-4">{c('Action')
                        .t`Create new items`}</div>
                    <img src={createItemArrow} alt="" className="pb-4" />
                </div>
            </div>

            <h2 className="text-bold flex justify-center mt-14">{c('Title').t`Get Started`}</h2>

            {plan === UserPassPlan.BUSINESS &&
                onboardingCards.map(({ imageSrc, title, description, onClick }) => (
                    <OnboardingCard
                        key={title}
                        imageSrc={imageSrc}
                        title={title}
                        description={description}
                        onClick={onClick}
                    />
                ))}
        </div>
    );
};
