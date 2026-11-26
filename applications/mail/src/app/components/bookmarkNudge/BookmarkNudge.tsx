import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { Button } from '@proton/atoms/Button/Button';
import { Kbd } from '@proton/atoms/Kbd/Kbd';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import { IcStar } from '@proton/icons/icons/IcStar';
import { MAIL_APP_NAME, MAILBOX_LABEL_IDS, SECOND } from '@proton/shared/lib/constants';
import { metaKey } from '@proton/shared/lib/helpers/browser';
import { useVariant } from '@proton/unleash/useVariant';

import { selectElementID, selectLabelID } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import { getIsUserEligible } from './bookmarkNudge.helpers';

const BookmarkNudgeContent = ({ onClose }: { onClose: () => void }) => {
    const shortcut = (
        <span key="shortcut" className="text-nowrap">
            <Kbd shortcut={metaKey} /> + <Kbd shortcut="D" />
        </span>
    );

    return (
        <div className="flex flex-nowrap items-start gap-4">
            <span
                className="shrink-0 w-custom h-custom rounded-lg flex items-center justify-center bg-weak color-primary"
                style={{ '--w-custom': '3rem', '--h-custom': '3rem' }}
            >
                <IcStar size={6} />
            </span>
            <div>
                <p className="m-0 mb-1 text-bold">{c('Title').t`Bookmark your shortcut to privacy`}</p>
                <p className="m-0 color-weak">
                    {
                        // translator: ${shortcut} is the keyboard shortcut to bookmark the page, "⌘ + D" on macOS and "Ctrl + D" on other systems
                        c('Info').jt`Press ${shortcut} to keep ${MAIL_APP_NAME} one click away.`
                    }
                </p>
                <Button className="mt-4" color="norm" size="small" onClick={onClose}>
                    {c('Action').t`Got it`}
                </Button>
            </div>
        </div>
    );
};

/**
 * Treatment users see the nudge once, 5 seconds after opening an email (not a draft).
 * Control users see nothing: Data compares the two groups from the Unleash assignment.
 */
const useBookmarkNudge = () => {
    const variant = useVariant('BookmarkNudgeExperiment');
    const [user] = useUser();
    const { welcomeFlags } = useWelcomeFlags();
    const elementID = useMailSelector(selectElementID);
    const labelID = useMailSelector(selectLabelID);
    // Opening a draft opens the composer, not an email
    const isInDrafts = labelID === MAILBOX_LABEL_IDS.DRAFTS || labelID === MAILBOX_LABEL_IDS.ALL_DRAFTS;
    const isEmailOpen = !!elementID && !isInDrafts;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.BookmarkNudgeSpotlight,
        variant.name === 'Treatment' && isEmailOpen && getIsUserEligible(user, welcomeFlags.isDone)
    );
    const shouldShow = useSpotlightShow(show, 5 * SECOND);

    return { shouldShow, onDisplayed, onClose };
};

export const BookmarkNudge = ({ children }: { children: ReactNode }) => {
    const { shouldShow, onDisplayed, onClose } = useBookmarkNudge();

    return (
        <Spotlight
            show={shouldShow}
            content={<BookmarkNudgeContent onClose={onClose} />}
            borderRadius="xl"
            innerClassName="p-6"
            onDisplayed={onDisplayed}
            onClose={onClose}
            originalPlacement="bottom-end"
        >
            <div>{children}</div>
        </Spotlight>
    );
};
