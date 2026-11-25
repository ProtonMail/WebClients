import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import spotlightStar from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface BYOEInboxCleanupSpotlightProps {
    isNewToMailingLists: boolean;
    onOpen: () => void;
}

// Always says Mailing lists, even where the sidebar item is called Newsletters
export const BYOEInboxCleanupSpotlight = ({ isNewToMailingLists, onOpen }: BYOEInboxCleanupSpotlightProps) => {
    const title = isNewToMailingLists
        ? c('Title').t`Meet Mailing lists`
        : c('Title').t`Your Gmail newsletters are here`;
    const text = isNewToMailingLists
        ? c('Info')
              .t`Your Gmail newsletters are now grouped by sender, away from your personal mail. Read, keep or stop them in one place.`
        : c('Info')
              .t`We've added the newsletters from your Gmail import to Mailing lists, grouped by sender. Read, keep or stop them in one place.`;

    return (
        <div className="flex flex-nowrap items-start gap-4">
            <div className="shrink-0">
                <img alt="" src={spotlightStar} className="w-custom" style={{ '--w-custom': '2.5rem' }} />
            </div>
            <div className="flex flex-column flex-nowrap items-start">
                <p className="text-bold m-0 mb-2">{title}</p>
                <p className="m-0 mb-2">{text}</p>
                <InlineLinkButton onClick={onOpen}>{c('Action').t`Open Mailing lists`}</InlineLinkButton>
            </div>
        </div>
    );
};
