import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useUserSettings, useWelcomeFlags } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { useMeetFunnelTelemetry } from '@proton/calendar/protonMeetIntegration/meetFunnelTelemetry';
import useAppLink from '@proton/components/components/link/useAppLink';
import Logo from '@proton/components/components/logo/Logo';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { useHasMeetProductAccess } from '@proton/meet/hooks/useHasMeetProductAccess';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, MEET_APP_NAME, MEET_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

export const useProtonMeetSpotlight = () => {
    const [user] = useUser();
    const goToApp = useAppLink();
    const { sendSpotlightDisplayed, sendExploreMeetClicked } = useMeetFunnelTelemetry();

    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');
    const {
        welcomeFlags: { isDone: hasUserFinishedWelcomeFlow },
    } = useWelcomeFlags();

    const meetSpotlightType = useFlag('MeetSpotlightType');
    const meetSpotlightTypeVariant = useVariant('MeetSpotlightType');

    const [settings] = useUserSettings();

    const usedMeet = (settings.UsedClients ?? []).some((client) => client.toLowerCase().includes('meet'));

    const userAccountHasMoreThanThreeDays = isUserAccountOlderThanOrEqualToDays(user, 3);

    const hasMeetProductAccess = useHasMeetProductAccess();

    const spotlightTelemetrySent = useRef(false);

    const {
        show: showProtonMeetSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.NewScheduleOptionSpotlight,
        isMeetVideoConferenceEnabled &&
            hasUserFinishedWelcomeFlow &&
            userAccountHasMoreThanThreeDays &&
            !usedMeet &&
            hasMeetProductAccess
    );

    const spotlightEnabled = showProtonMeetSpotlight && meetSpotlightType;

    const shouldShowProtonMeetSpotlight = useSpotlightShow(spotlightEnabled, 3000);

    const handleExploreMeet = () => {
        sendExploreMeetClicked();
        onClose();

        if (isElectronApp) {
            window.open(getAppHref('/', APPS.PROTONMEET), '_blank', 'noopener,noreferrer');
            return;
        }

        goToApp('/', APPS.PROTONMEET, true);
    };

    const getSpotlightContent = () => {
        return (
            <>
                <div className="flex flex-nowrap items-start mb-1 gap-4">
                    <div className="shrink-0 relative top-custom" style={{ '--top-custom': '-0.25rem' }}>
                        <Logo
                            className="shrink-0 w-custom"
                            style={{ '--w-custom': '2.75rem' }}
                            appName={APPS.PROTONMEET}
                            variant="glyph-only"
                            size={9}
                        />
                    </div>
                    <div
                        className="flex flex-column flex-nowrap items-start w-custom"
                        style={{ '--w-custom': '15rem' }}
                    >
                        <p className="text-lg text-bold m-0 mb-1">{c('Spotlight').t`${MEET_APP_NAME} is here!`}</p>
                        <p className="m-0 w-custom" style={{ '--w-custom': '15rem' }}>{c('Spotlight')
                            .t`Schedule and join ${MEET_APP_NAME} calls right from your calendar.`}</p>

                        {meetSpotlightTypeVariant.name === 'cta' && (
                            <Button className="mt-2" onClick={handleExploreMeet} color="norm">{c('Action')
                                .t`Explore ${MEET_SHORT_APP_NAME}`}</Button>
                        )}
                    </div>
                </div>
            </>
        );
    };

    useEffect(() => {
        if (
            shouldShowProtonMeetSpotlight &&
            typeof meetSpotlightTypeVariant.name === 'string' &&
            meetSpotlightTypeVariant.name !== 'disabled' &&
            !spotlightTelemetrySent.current
        ) {
            sendSpotlightDisplayed(meetSpotlightTypeVariant.name);
            spotlightTelemetrySent.current = true;
        }
        // We only need to run this effect when the spotlight should be shown
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldShowProtonMeetSpotlight]);

    return {
        spotlightContent: getSpotlightContent(),
        shouldShowSpotlight: shouldShowProtonMeetSpotlight,
        onDisplayed,
        onClose,
    };
};
