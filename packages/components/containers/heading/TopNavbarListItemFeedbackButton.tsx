import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import TopNavbarListItemButton from '@proton/components/components/topnavbar/TopNavbarListItemButton';

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
            icon={<Icon name="speech-bubble" />}
            text={c('Title').t`Feedback`}
        />
    );
};

export default TopNavbarListItemFeedbackButton;
