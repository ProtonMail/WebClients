import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import { useRevisionsModal } from '../../../modals/RevisionsModal/RevisionsModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    selectedLink: DecryptedLink;
    showRevisionsModal: ReturnType<typeof useRevisionsModal>[1];
    close: () => void;
}

const RevisionsButton = ({ selectedLink, showRevisionsModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`See version history`}
            icon="clock-rotate-left"
            testId="context-menu-revisions"
            action={() => showRevisionsModal({ link: selectedLink })}
            close={close}
        />
    );
};

export default RevisionsButton;
