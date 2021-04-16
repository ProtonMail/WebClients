import { c } from 'ttag';
import React from 'react';

import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import Icon from '../../components/icon/Icon';
import { useModals } from '../../hooks';
import FeedbackModal from './FeedbackModal';

const TopNavbarListItemFeedbackButton = () => {
    const { createModal } = useModals();
    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={c('Title').t`Send feedback`}
            onClick={() => createModal(<FeedbackModal />)}
            icon={<Icon name="help-answer" />}
            text={c('Title').t`Feedback`}
        />
    );
};

export default TopNavbarListItemFeedbackButton;
