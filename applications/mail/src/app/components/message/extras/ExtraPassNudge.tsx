import { useEffect, useMemo, useState } from 'react';

import { addDays, isBefore } from 'date-fns';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button, ButtonLike } from '@proton/atoms/index';
import { AppLink, Checkbox, Icon, Logo, Tooltip, useActiveBreakpoint, useModalState } from '@proton/components';
import Prompt from '@proton/components/components/prompt/Prompt';
import useLocalState from '@proton/components/hooks/useLocalState';
import { FeatureCode, useFeature } from '@proton/features';
import { TelemetryPassNudgeEvents } from '@proton/shared/lib/api/telemetry';
import { APPS, BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isPassUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import PasswordResetDetector from '@proton/shared/lib/mail/PasswordResetDetector';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import usePassNudgeTelemetry, { PASS_NUDGE_INTERACTION_TYPE, PASS_NUDGE_SOURCE } from '../hooks/usePassNudgeTelemetry';

interface Props {
    messageSubject: string;
}

const ExtraPassNudge = ({ messageSubject = '' }: Props) => {
    const [{ isFree, ID }, loadingUser] = useUser();
    const [{ UsedClientFlags }, loadingUserSettings] = useUserSettings();
    const isFeatureEnabled = useFlag('PasswordNudge');
    const isFeatureEnabledForPaidUsers = useFlag('PasswordNudgeForPaidUsers');
    const sendTelemetry = usePassNudgeTelemetry();

    const { viewportWidth } = useActiveBreakpoint();

    const {
        feature: dontShowAgainFlag,
        update,
        loading: loadingDontShowAgain,
    } = useFeature(FeatureCode.PassNudgeDontShowAgain);

    // If the user closed the banner, we store the date in the local storage
    const [closedBannerOn, setClosedBannerOn] = useLocalState<number>(0, `${ID}-hide-pass-nudge`);

    const [dontShowAgainCheckbox, setDontShowAgainCheckbox] = useState(false);
    const [infoModalProps, showInfoModal, renderInfoModal] = useModalState();

    // If a value is found in the local storage, check if it was stored less than 30 days ago
    const shouldHideBanner = useMemo(() => {
        return closedBannerOn ? isBefore(new Date(), addDays(new Date(closedBannerOn), 30)) : false;
    }, [closedBannerOn]);

    const hasNeverUsedPass = UsedClientFlags ? !isPassUser(BigInt(UsedClientFlags)) : false;
    const { isReset } = PasswordResetDetector.isPasswordResetEmail(messageSubject);

    /* Show pass nudge when
     * - Not in loading state
     * - Feature flag "PasswordNudge" is ON
     * - The user is free or is paid and feature flag "PasswordNudgeForPaidUsers" is ON
     * - The user did not choose to hide the banner forever
     * - Email is detected as a password reset email
     * - The user never used Proton Pass before
     * - The user did not hide the banner, or it was more than 30 days ago
     */
    const showPassNudge =
        !loadingUserSettings &&
        !loadingUser &&
        isFeatureEnabled &&
        (isFree || (!isFree && isFeatureEnabledForPaidUsers)) &&
        !dontShowAgainFlag?.Value &&
        !loadingDontShowAgain &&
        isReset &&
        hasNeverUsedPass &&
        !shouldHideBanner;

    useEffect(() => {
        if (showPassNudge) {
            sendTelemetry({
                event: TelemetryPassNudgeEvents.banner_display,
                dimensions: {
                    isPassUser: (!hasNeverUsedPass).toString(),
                    source: PASS_NUDGE_SOURCE,
                },
            });
        }
    }, [showPassNudge, isFree, hasNeverUsedPass, sendTelemetry]);

    const handleCloseInfoModal = () => {
        if (dontShowAgainCheckbox) {
            void update(true);
        }
        infoModalProps.onClose();

        sendTelemetry({
            event: TelemetryPassNudgeEvents.banner_interaction,
            dimensions: {
                isPassUser: (!hasNeverUsedPass).toString(),
                interactionType: dontShowAgainCheckbox
                    ? PASS_NUDGE_INTERACTION_TYPE.DONT_SHOW_FOREVER
                    : PASS_NUDGE_INTERACTION_TYPE.DISMISS_FOR_30_DAYS,
                source: PASS_NUDGE_SOURCE,
            },
        });
    };

    const handleClickOpenPass = () => {
        void update(true);

        sendTelemetry({
            event: TelemetryPassNudgeEvents.pass_cta_click,
            dimensions: {
                isPassUser: (!hasNeverUsedPass).toString(),
                source: PASS_NUDGE_SOURCE,
            },
        });
    };

    const handleClickMoreInfo = () => {
        showInfoModal(true);

        sendTelemetry({
            event: TelemetryPassNudgeEvents.banner_interaction,
            dimensions: {
                isPassUser: (!hasNeverUsedPass).toString(),
                interactionType: PASS_NUDGE_INTERACTION_TYPE.MORE_INFO,
                source: PASS_NUDGE_SOURCE,
            },
        });
    };

    if (!showPassNudge) {
        return null;
    }

    function handleCloseBanner(): void {
        setClosedBannerOn(new Date().getTime());
        sendTelemetry({
            event: TelemetryPassNudgeEvents.banner_interaction,
            dimensions: {
                isPassUser: (!hasNeverUsedPass).toString(),
                interactionType: PASS_NUDGE_INTERACTION_TYPE.DISMISS_FOR_30_DAYS,
                source: PASS_NUDGE_SOURCE,
            },
        });
    }

    return (
        <div className="banner banner banner--norm-outline w-full border border-weak rounded w-full relative group-hover-opacity-container">
            <div className="banner-inner p-1">
                <div className="banner-main gap-2 pl-1 py-0.5">
                    <div className="flex flex-nowrap">
                        <div className="flex-1">
                            <p className="mt-0 mb-1">
                                {c('Info')
                                    .t`${BRAND_NAME}'s password manager lets you create, store, and autofill passwords, so you never have to reset them.`}
                            </p>
                            <div className="flex items-center justify-space-between banner-action banner-action--no-padding mb-0.5">
                                <ButtonLike
                                    as={AppLink}
                                    to="/"
                                    toApp={APPS.PROTONPASS}
                                    color="weak"
                                    shape="outline"
                                    size="small"
                                    onClick={handleClickOpenPass}
                                    className="inline-flex flex-nowrap flex-row items-center justify-center"
                                >
                                    <Logo appName={APPS.PROTONPASS} variant="glyph-only" size={6} className="mr-2" />
                                    {c('Action').t`Use ${PASS_APP_NAME}`}
                                </ButtonLike>
                            </div>
                        </div>
                        <div className="shrink-0 ml-1 flex flex-column flex-nowrap justify-space-between">
                            <Tooltip title={c('Action').t`Dismiss`}>
                                <Button
                                    size="small"
                                    shape="ghost"
                                    icon
                                    className={clsx(
                                        'close-button inline-flex mx-auto bg-norm z-up interactive p-0',
                                        !viewportWidth['<=small'] &&
                                            'absolute top-0 right-0 border border-weak shadow-norm rounded-full group-hover:opacity-100'
                                    )}
                                    onClick={handleCloseBanner}
                                >
                                    <Icon name="cross" size={4} className="flex m-auto" alt={c('Action').t`Dismiss`} />
                                </Button>
                            </Tooltip>
                            <Tooltip title={c('Info').t`More infos`}>
                                <Button
                                    icon
                                    shape="ghost"
                                    size="small"
                                    className="mb-1 mt-auto"
                                    onClick={handleClickMoreInfo}
                                >
                                    <Icon name="question-circle" className="color-weak" alt={c('Info').t`More infos`} />
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {renderInfoModal && (
                    <Prompt
                        title={c('Title').t`On-device suggestions`}
                        buttons={[<Button onClick={handleCloseInfoModal} color="norm">{c('Action').t`Got it`}</Button>]}
                        {...infoModalProps}
                    >
                        <div>
                            <p>{c('Info')
                                .t`This was shown to you because your email subject line contains password reset keywords.`}</p>
                            <p>{c('Info')
                                .t`Detection takes place on your device, so no data from your emails is sent to our servers.`}</p>
                            <div>
                                <Checkbox
                                    checked={dontShowAgainCheckbox}
                                    onChange={() => {
                                        setDontShowAgainCheckbox(!dontShowAgainCheckbox);
                                    }}
                                >
                                    {c('Label').t`Don't show this suggestion`}
                                </Checkbox>
                            </div>
                        </div>
                    </Prompt>
                )}
            </div>
        </div>
    );
};

export default ExtraPassNudge;
