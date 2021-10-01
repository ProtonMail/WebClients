import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import useToolbarActions from '../../../../hooks/drive/useActions';
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
