import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import onboardingExtension from '@proton/pass/assets/b2b-onboarding/icons/extension-icon.svg';
import onboardingImport from '@proton/pass/assets/b2b-onboarding/icons/import-icon.svg';
import onboardingShare from '@proton/pass/assets/b2b-onboarding/icons/share-icon.svg';
import onboardingVault from '@proton/pass/assets/b2b-onboarding/icons/vault-icon.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { useInviteContext } from '@proton/pass/components/Invite/InviteProvider';
import { OnboardingArrow } from '@proton/pass/components/Onboarding/Panel/OnboardingArrow';
import type { OnboardingCardProps } from '@proton/pass/components/Onboarding/Panel/OnboardingCard';
import { OnboardingCard } from '@proton/pass/components/Onboarding/Panel/OnboardingCard';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { selectOnboardingState } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { clients } from '@proton/shared/lib/pass/constants';

type OnboardingCardType = Pick<OnboardingCardProps, 'imageSrc' | 'title' | 'description' | 'onClick' | 'actionDone'>;

export const B2BOnboarding: FC = () => {
    const { openSettings, onLink } = usePassCore();

    const vaultActions = useVaultActions();
    const inviteContext = useInviteContext();

    const { vaultCreated, vaultImported, vaultShared } = useSelector(selectOnboardingState);
    const { installed, supportedBrowser } = usePassExtensionLink();
    const browser = supportedBrowser ? clients[supportedBrowser] : null;

    const onboardingCards = useMemo<OnboardingCardType[]>(
        () => [
            {
                imageSrc: onboardingImport,
                title: c('Title').t`Import your data`,
                description: c('Info').t`Bring your existing passwords into ${BRAND_NAME}.`,
                onClick: () => openSettings?.('import'),
                actionDone: vaultImported,
            },
            {
                imageSrc: onboardingVault,
                title: c('Title').t`Create a vault`,
                description: c('Info').t`Get the most out of Pass by creating a vault for each team or project.`,
                onClick: vaultActions.create,
                actionDone: vaultCreated,
            },
            {
                imageSrc: onboardingShare,
                title: c('Title').t`Share vaults with your team`,
                description: c('Info').t`Invite specific people and set the right permissions.`,
                onClick: () => inviteContext.createSharedVault({ item: undefined }),
                actionDone: vaultShared,
            },
            ...(browser
                ? [
                      {
                          imageSrc: onboardingExtension,
                          title: c('Title').t`Install extension`,
                          description: c('Info')
                              .t`Install ${PASS_APP_NAME} for ${browser.title} to quickly autofill your logins.`,
                          onClick: () => onLink(browser.link),
                          actionDone: installed,
                      },
                  ]
                : []),
        ],
        []
    );

    return (
        <div className="flex flex-column w-full items-center overflow-x-auto">
            <div
                className="absolute top-custom right-custom"
                style={{ '--right-custom': '24px', '--top-custom': '10px' }}
            >
                <OnboardingArrow />
            </div>
            <div className="flex w-2/3 max-w-custom gap-4 justify-center" style={{ '--max-w-custom': '30rem' }}>
                <h2 className="text-bold flex justify-center mt-14">{c('Title').t`Get Started`}</h2>

                {onboardingCards.map(({ imageSrc, title, description, onClick, actionDone }) => (
                    <OnboardingCard
                        key={title}
                        imageSrc={imageSrc}
                        title={title}
                        description={description}
                        onClick={onClick}
                        actionDone={actionDone}
                    />
                ))}
            </div>
        </div>
    );
};
