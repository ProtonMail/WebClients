import { ReactNode, RefObject } from 'react';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { useAssistant } from '@proton/llm/lib';
import spotlightImg from '@proton/styles/assets/img/illustrations/ai-assistant-spotlight.svg';

interface Props {
    anchorRef: RefObject<HTMLElement>;
    children: ReactNode;
}

const ComposerAssistantSpotlight = ({ children, anchorRef }: Props) => {
    const [user] = useUser();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);
    const { canShowAssistant } = useAssistant();

    /**
     * Display the spotlight when:
     * - User has done the welcome flow
     * - The user account is older than 2 days
     * - The assistant feature flag is ON
     * - The user has the system requirements (hardware + browser) needed to use the assistant
     * - The user can use the assistant (the trial period is not over, or the user subscribed to the addon)
     */
    const displaySpotlight = isDone && userAccountHasMoreThanTwoDays && canShowAssistant;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.ComposerAssistantSpotlight,
        displaySpotlight
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    const spotlightTitle = c('Header').t`Write faster with the writing assistant`;
    const spotlightBody = c('Info')
        .t`Let the writing assistant help you write and reply to emails, and watch your productivity soar.`;

    return (
        <div
            onClick={() => {
                // Close spotlight if user click "compose" button
                onClose();
            }}
        >
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
        </div>
    );
};

export default ComposerAssistantSpotlight;
