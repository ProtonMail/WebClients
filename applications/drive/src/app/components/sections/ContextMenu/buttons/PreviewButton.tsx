import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    close: () => void;
}

const PreviewButton = ({ shareId, link, close }: Props) => {
    const { openPreview } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => openPreview(shareId, link.linkId)}
            close={close}
        />
    );
};

export default PreviewButton;
