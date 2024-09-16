import { type FC, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Scroll } from '@proton/atoms';
import onboardingExtension from '@proton/pass/assets/b2b-onboarding/icons/extension-icon.svg';
import onboardingImport from '@proton/pass/assets/b2b-onboarding/icons/import-icon.svg';
import onboardingShare from '@proton/pass/assets/b2b-onboarding/icons/share-icon.svg';
import onboardingVault from '@proton/pass/assets/b2b-onboarding/icons/vault-icon.svg';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassExtensionLink } from '@proton/pass/components/Core/PassExtensionLink';
import { useInviteContext } from '@proton/pass/components/Invite/InviteContext';
import { OnboardingArrow } from '@proton/pass/components/Onboarding/Panel/OnboardingArrow';
import type { OnboardingCardProps } from '@proton/pass/components/Onboarding/Panel/OnboardingCard';
import { OnboardingCard } from '@proton/pass/components/Onboarding/Panel/OnboardingCard';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultSelect, VaultSelectMode } from '@proton/pass/components/Vault/VaultSelect';
import { selectOnboardingState, selectWritableVaults } from '@proton/pass/store/selectors';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { clients } from '@proton/shared/lib/pass/constants';

import './B2BOnboarding.scss';

type OnboardingCardType = Pick<OnboardingCardProps, 'imageSrc' | 'title' | 'description' | 'onClick' | 'actionDone'>;

export const B2BOnboarding: FC = () => {
    const { openSettings, onLink } = usePassCore();

    const vaultActions = useVaultActions();
    const inviteContext = useInviteContext();

    const { vaultCreated, vaultImported, vaultShared } = useSelector(selectOnboardingState);
    const { installed, supportedBrowser } = usePassExtensionLink();
    const browser = supportedBrowser ? clients[supportedBrowser] : null;

    const vaults = useSelector(selectWritableVaults);
    const [selectVault, setSelectVault] = useState<boolean>(false);

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
                onClick: () => setSelectVault(true),
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
        [vaultCreated, vaultImported, vaultShared, installed]
    );

    return (
        <>
            <Scroll className="flex-1 flex-column align-center w-full pass-onboarding">
                <div className="flex justify-center pt-12 pb-2">
                    <h2 className="text-bold flex mt-10">{c('Title').t`Get Started`}</h2>
                    <div className="pass-onboarding--arrow absolute self-end mr-8 mt-2 pb-4 top-0 right-0">
                        <OnboardingArrow />
                    </div>
                </div>

                <div
                    className="flex w-full m-auto gap-4 md:w-2/3 max-w-custom p-4"
                    style={{ '--max-w-custom': '30rem' }}
                >
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
            </Scroll>

            <VaultSelect
                mode={VaultSelectMode.Writable}
                open={selectVault}
                title={c('Info').t`Select vault to share`}
                onClose={() => setSelectVault(false)}
                onSubmit={(shareId) => {
                    const vault = vaults.find((vault) => vault.shareId === shareId);
                    if (vault) {
                        inviteContext.createInvite({ vault });
                        setSelectVault(false);
                    }
                }}
            />
        </>
    );
};
