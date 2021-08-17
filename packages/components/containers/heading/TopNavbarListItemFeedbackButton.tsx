import { c } from 'ttag';

import TopNavbarListItemButton from '../../components/topnavbar/TopNavbarListItemButton';
import Icon from '../../components/icon/Icon';
import { useModals } from '../../hooks';

interface Props {
    modal: JSX.Element;
}

const TopNavbarListItemFeedbackButton = ({ modal }: Props) => {
    const { createModal } = useModals();
    return (
        <TopNavbarListItemButton
            as="button"
            type="button"
            title={c('Title').t`Send feedback`}
            onClick={() => createModal(modal)}
            icon={<Icon name="messages" />}
            text={c('Title').t`Feedback`}
        />
    );
};

export default TopNavbarListItemFeedbackButton;
