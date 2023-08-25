import { c } from 'ttag';

import { SYNC_G_OAUTH_SCOPES, SYNC_SOURCE, SYNC_SUCCESS_NOTIFICATION } from '@proton/activation/src/constants';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { ImportProvider, OAuthProps } from '@proton/activation/src/interface';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { changeCreateLoadingState, createSyncItem } from '@proton/activation/src/logic/sync/sync.actions';
import { selectCreateSyncState } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import {
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
    useActiveBreakpoint,
} from '@proton/components';
import GmailSyncModalAnimation from '@proton/components/containers/gmailSyncModal/GmailSyncModalAnimation';
import SignInWithGoogle from '@proton/components/containers/gmailSyncModal/SignInWithGoogle';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import blockSender from '@proton/styles/assets/img/onboarding/mail_onboarding_block_sender.svg';
import blockTrackers from '@proton/styles/assets/img/onboarding/mail_onboarding_block_trackers.svg';
import encryption from '@proton/styles/assets/img/onboarding/mail_onboarding_encryption.svg';
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
    const { isNarrow } = useActiveBreakpoint();

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
                        Source: SYNC_SOURCE,
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

    const maxContentHeight = isNarrow ? 'auto' : '30rem';
    const onboardingSteps = [
        ({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding modal').t`Congratulations on choosing privacy`}
                    className="h-custom"
                    style={{ '--h-custom': maxContentHeight }}
                >
                    <div className={clsx('flex', isNarrow ? 'gap-y-4 pt-4' : 'gap-y-8 pt-6')}>
                        {privacyFeature.map(({ title, description, imgSrc }, index) => (
                            <div className="flex flex-row gap-4 flex-align-items-center" key={index}>
                                <img
                                    className={clsx('w-custom', isNarrow && 'flex-align-self-start')}
                                    style={{ '--w-custom': isNarrow ? '3rem' : '5rem' }}
                                    src={imgSrc}
                                    alt=""
                                />
                                <div className="flex-item-fluid flex flex-col gap-0">
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

    const extraSteps = [
        ({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={c('Onboarding modal').t`Automatically forward emails`}
                    description={c('Onboarding modal').t`Forward Gmail messages to your inbox.`}
                    className="h-custom"
                    style={{ '--h-custom': maxContentHeight }}
                >
                    <div className="flex gap-1 flex-justify-center">
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
        ),
    ];

    return (
        <OnboardingModal
            {...props}
            size="large"
            showGenericSteps={false}
            maxContentHeight={maxContentHeight}
            extraProductStep={extraSteps}
        >
            {onboardingSteps}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
