import { c } from 'ttag';

import useToolbarActions from '../../../../hooks/drive/useActions';
import { FileBrowserItem } from '../../../FileBrowser';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const DownloadButton = ({ shareId, items, close }: Props) => {
    const { download } = useToolbarActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Download`}
            icon="arrow-down-to-rectangle"
            testId="context-menu-download"
            action={() => download(shareId, items)}
            close={close}
        />
    );
};

export default DownloadButton;
