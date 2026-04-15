import { c } from 'ttag';

import TopNavbarListItemButton from '@proton/components/components/topnavbar/TopNavbarListItemButton';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';

interface Props {
    onClick: () => void;
}

const TopNavbarListItemFeedbackButton = ({ onClick }: Props) => {
    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={c('Title').t`Send feedback`}
            onClick={onClick}
            icon={<IcSpeechBubble />}
            text={c('Title').t`Feedback`}
        />
    );
};

export default TopNavbarListItemFeedbackButton;
