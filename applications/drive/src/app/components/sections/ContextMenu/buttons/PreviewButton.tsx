import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import useToolbarActions from '../../../../hooks/drive/useActions';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    close: () => void;
}

const PreviewButton = ({ shareId, item, close }: Props) => {
    const { preview } = useToolbarActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Preview`}
            icon="eye"
            testId="context-menu-preview"
            action={() => preview(shareId, item)}
            close={close}
        />
    );
};

export default PreviewButton;
