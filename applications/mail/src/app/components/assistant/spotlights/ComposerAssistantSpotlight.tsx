import { ReactNode, RefObject } from 'react';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { ASSISTANT_FEATURE_NAME, useAssistant } from '@proton/llm/lib';
import spotlightImg from '@proton/styles/assets/img/illustrations/ai-assistant-spotlight.svg';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
}

const ComposerAssistantSpotlight = ({ children, anchorRef }: Props) => {
    const [user] = useUser();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);
    const { canShowAssistant, hasCompatibleHardware, hasCompatibleBrowser, canUseAssistant } = useAssistant();

    /**
     * Display the spotlight when:
     * - User has done the welcome flow
     * - The user account is older than 2 days
     * - The assistant feature flag is ON
     * - The user has the system requirements (hardware + browser) needed to use the assistant
     * - The user can use the assistant (the trial period is not over, or the user subscribed to the addon)
     */
    const displaySpotlight =
        isDone &&
        userAccountHasMoreThanTwoDays &&
        canShowAssistant &&
        hasCompatibleHardware &&
        hasCompatibleBrowser &&
        canUseAssistant;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantSpotlight,
        displaySpotlight
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    /* translator:
     * Full string for reference: Write faster with AI Assistant
     */
    const spotlightTitle = c('loc_nightly_assistant').t`Write faster with ${ASSISTANT_FEATURE_NAME}`;

    /* translator:
     * Full string for reference: Let AI Assistant help you write and reply to emails, and watch your productivity soar.
     */
    const spotlightBody = c('loc_nightly_assistant')
        .t`Let ${ASSISTANT_FEATURE_NAME} help you write and reply to emails, and watch your productivity soar.`;

    return (
        <Spotlight
            originalPlacement="right"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            onClose={onClose}
            content={
                <div className="flex flex-nowrap my-2">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightImg} alt="" />
                    </div>
                    <div>
                        <p className="mt-0 mb-2 text-bold">{spotlightTitle}</p>
                        <p className="m-0">{spotlightBody}</p>
                    </div>
                </div>
            }
        >
            {children}
        </Spotlight>
    );
};

export default ComposerAssistantSpotlight;
