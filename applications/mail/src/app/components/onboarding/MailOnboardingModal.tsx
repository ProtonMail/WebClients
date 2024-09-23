import { c } from 'ttag';

import { SYNC_G_OAUTH_SCOPES, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import type { OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportProvider } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button, Href } from '@proton/atoms';
import {
    GmailSyncModalAnimation,
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    type OnboardingStepRenderCallback,
    SignInWithGoogle,
    useActiveBreakpoint,
} from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import blockSender from '@proton/styles/assets/img/onboarding/mail_onboarding_block_sender.svg';
import blockTrackers from '@proton/styles/assets/img/onboarding/mail_onboarding_block_trackers.svg';
import encryption from '@proton/styles/assets/img/onboarding/mail_onboarding_encryption.svg';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

interface Props {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const MailOnboardingModal = (props: Props) => {
    const { markItemsAsDone } = useGetStartedChecklist();
    const { viewportWidth } = useActiveBreakpoint();

    const isImporterInMaintenance = useFlag('MaintenanceImporter');

    const dispatch = useEasySwitchDispatch();
    const syncState = useEasySwitchSelector(selectCreateSyncState);
    const loading = syncState === 'pending';
    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('loc_nightly:Error').t`Your sync will not be processed.`,
    });

    const handleGoogleSync = (onNext: () => void) => {
        triggerOAuthPopup({
            provider: ImportProvider.GOOGLE,
            scope: SYNC_G_OAUTH_SCOPES.join(' '),
            callback: async (oAuthProps: OAuthProps) => {
                const { Code, Provider, RedirectUri } = oAuthProps;
                dispatch(changeCreateLoadingState('pending'));
                const res = await dispatch(
                    createSyncItem({
                        Code,
                        Provider,
                        RedirectUri,
                        Source: EASY_SWITCH_SOURCES.MAIL_WEB_ONBOARDING,
                        notification: SYNC_SUCCESS_NOTIFICATION,
                    })
                );

                const hasError = res.type.endsWith('rejected');
                if (!hasError) {
                    onNext();
                }
            },
        });
    };

    // translator: Complete the sentence "We stop advertisers and data collectors from profiling you. Learn more"
    const kbLinkPrivacy = (
        <Href className="color-weak text-ellipsis" href={getKnowledgeBaseUrl('/email-tracker-protection')}>
            {c('Info').t`Learn more`}
        </Href>
    );
    // translator: Complete the sentence "Block email communications from scammers permanently. Learn more"
    const kbLinkSender = (
        <Href className="color-weak text-ellipsis" href={getKnowledgeBaseUrl('/block-sender')}>
            {c('Info').t`Learn more`}
        </Href>
    );
    // translator: Complete the sentence "Encryption so strong, only you and intended recipients can view your emails. Learn more"
    const kbLinkEncryption = (
        <Href className="color-weak text-ellipsis" href={getKnowledgeBaseUrl('/proton-mail-encryption-explained')}>
            {c('Info').t`Learn more`}
        </Href>
    );

    const privacyFeature = [
        {
            title: c('Onboarding modal').t`Protection from trackers`,
            // translator: full sentence is: "We stop advertisers and data collectors from profiling you. Learn more"
            description: c('Onboarding modal')
                .jt`We stop advertisers and data collectors from profiling you. ${kbLinkPrivacy}`,
            imgSrc: blockTrackers,
        },
        {
            title: c('Onboarding modal').t`Block unsavory senders`,
            // translator: full sentence is: "Block email communications from scammers permanently. Learn more"
            description: c('Onboarding modal')
                .jt`Block email communications from scammers permanently. ${kbLinkSender}`,
            imgSrc: blockSender,
        },
        {
            title: c('Onboarding modal').t`For your eyes only`,
            // translator: full sentence is: "Encryption so strong, only you and intended recipients can view your emails. Learn more"
            description: c('Onboarding modal')
                .jt`Encryption so strong, only you and intended recipients can view your emails. ${kbLinkEncryption}`,
            imgSrc: encryption,
        },
    ];

    const onboardingSteps = [
        ({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent title={c('Onboarding modal').t`Congratulations on choosing privacy`}>
                    <div className="flex gap-y-4 pt-4 sm:gap-y-8 sm:pt-6">
                        {privacyFeature.map(({ title, description, imgSrc }, index) => (
                            <div className="flex flex-row gap-4 items-center" key={index}>
                                <img
                                    className={clsx('w-custom', viewportWidth['<=small'] && 'self-start')}
                                    style={{ '--w-custom': viewportWidth['<=small'] ? '3rem' : '5rem' }}
                                    src={imgSrc}
                                    alt=""
                                />
                                <div className="flex-1 flex gap-0">
                                    <h2 className="text-rg text-bold">{title}</h2>
                                    <p className="m-0 text-weak">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </OnboardingContent>
                <footer>
                    <Button
                        size="large"
                        fullWidth
                        onClick={() => {
                            markItemsAsDone('ProtectInbox');
                            onNext();
                        }}
                    >
                        {c('Onboarding modal').t`Next`}
                    </Button>
                </footer>
            </OnboardingStep>
        ),
    ];

    const extraSteps = [];
    if (!isImporterInMaintenance) {
        extraSteps.push(({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding modal').t`Automatically forward emails`}
                    description={c('Onboarding modal').t`Forward Gmail messages to your inbox.`}
                >
                    <div className="flex gap-1 justify-center">
                        <div className="text-sm w-full h-full">
                            <GmailSyncModalAnimation reduceHeight />
                        </div>
                        <SignInWithGoogle
                            onClick={() => handleGoogleSync(onNext)}
                            loading={loading}
                            disabled={loadingConfig}
                            reduceHeight
                            fullWidth
                        />
                    </div>
                </OnboardingContent>
                <footer>
                    <Button size="large" fullWidth onClick={onNext}>
                        {c('Onboarding modal').t`Skip`}
                    </Button>
                </footer>
            </OnboardingStep>
        ));
    }

    return (
        <OnboardingModal {...props} size="large" showGenericSteps={false} extraProductStep={extraSteps}>
            {onboardingSteps}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
