import { c } from 'ttag';

import TopNavbarListItemButton from '@proton/components/components/topnavbar/TopNavbarListItemButton';

import Icon from '../../components/icon/Icon';

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
