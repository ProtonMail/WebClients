import { c } from 'ttag';
import { ReactNode } from 'react';

import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import Icon from '../../components/icon/Icon';
import { useModals } from '../../hooks';

interface Props {
    modal: ReactNode;
}

const TopNavbarListItemFeedbackButton = ({ modal }: Props) => {
    const { createModal } = useModals();
    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={c('Title').t`Send feedback`}
            onClick={() => createModal(modal)}
            icon={<Icon name="help-answer" />}
            text={c('Title').t`Feedback`}
        />
    );
};

export default TopNavbarListItemFeedbackButton;
