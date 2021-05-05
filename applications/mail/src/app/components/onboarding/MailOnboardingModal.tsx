import React from 'react';
import { c } from 'ttag';
import onboardingMailWelcome from 'design-system/assets/img/onboarding/mail-welcome.svg';
import onboardingImportAssistant from 'design-system/assets/img/onboarding/import-assistant.svg';
import {
    OnboardingContent,
    OnboardingModal,
    OnboardingStep,
    OnboardingStepRenderCallback,
    useSettingsLink,
    QRCode,
    useFeature,
    useImporters,
    FeatureCode,
} from 'react-components';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { APPS } from 'proton-shared/lib/constants';

const MailOnboardingModal = (props: any) => {
    const appName = getAppName(APPS.PROTONMAIL);
    const goToSettings = useSettingsLink();
    const link = <strong key="link">pm.me/app</strong>;
    const [imports, importsLoading] = useImporters();
    const hasAlreadyImported = !importsLoading && imports.length;
    const { feature } = useFeature(FeatureCode.UsedMailMobileApp);

    return (
        <OnboardingModal {...props}>
            {[
                ({ onNext, displayGenericSteps }: OnboardingStepRenderCallback) =>
                    displayGenericSteps ? null : (
                        <OnboardingStep submit={c('Onboarding').t`Next`} onSubmit={onNext} close={null}>
                            <OnboardingContent
                                img={
                                    <img
                                        src={onboardingMailWelcome}
                                        alt={c('Onboarding ProtonMail').t`Meet your encrypted mailbox`}
                                    />
                                }
                                title={c('Onboarding ProtonMail').t`Meet your encrypted mailbox`}
                                description={c('Onboarding ProtonMail')
                                    .t`${appName} is now more modern and customizable while still protecting your data with advanced encryption.`}
                            />
                        </OnboardingStep>
                    ),
                ({ onNext }: OnboardingStepRenderCallback) =>
                    feature === undefined || feature.Value ? null : (
                        <OnboardingStep submit={c('Onboarding').t`Next`} onSubmit={onNext} close={null}>
                            <OnboardingContent
                                title={c('Onboarding ProtonMail').t`Get the ${appName} mobile app`}
                                description={c('Onboarding ProtonMail').t`Available on iOS and Android.`}
                            >
                                <div className="text-center">
                                    <QRCode value="https://pm.me/app?type=qr" size={200} />
                                </div>
                                <p className="text-center">{c('Info')
                                    .jt`Using your mobile device, scan this QR-Code or visit ${link}.`}</p>
                            </OnboardingContent>
                        </OnboardingStep>
                    ),
                ({ onNext }: OnboardingStepRenderCallback) =>
                    hasAlreadyImported ? null : (
                        <OnboardingStep
                            submit={c('Action').t`Import messages`}
                            onSubmit={() => {
                                goToSettings('/import-export', APPS.PROTONMAIL, true);
                                onNext();
                            }}
                            onClose={onNext}
                            close={c('Action').t`Start using ${appName}`}
                        >
                            <OnboardingContent
                                img={
                                    <img
                                        src={onboardingImportAssistant}
                                        alt={c('Onboarding ProtonMail').t`Import your messages`}
                                    />
                                }
                                title={c('Onboarding ProtonMail').t`Import your messages`}
                                description={c('Onboarding ProtonMail')
                                    .t`Our Import Assistant quickly transfers all your emails to your new encrypted mailbox.`}
                            />
                        </OnboardingStep>
                    ),
            ]}
        </OnboardingModal>
    );
};

export default MailOnboardingModal;
