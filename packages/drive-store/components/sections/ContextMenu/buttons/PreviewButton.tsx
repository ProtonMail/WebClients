import { c } from 'ttag';

import useOpenPreview from '../../../useOpenPreview';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    linkId: string;
    close: () => void;
}

const PreviewButton = ({ shareId, linkId, close }: Props) => {
    const openPreview = useOpenPreview();

    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => openPreview(shareId, linkId)}
            close={close}
        />
    );
};

export default PreviewButton;
