import { c } from 'ttag';

import useDriveNavigation from '../../../../hooks/drive/useNavigate';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    parentLinkId: string;
    close: () => void;
}

export default function GoToParent({ shareId, parentLinkId, close }: Props) {
    const { navigateToLink } = useDriveNavigation();

    return (
        <ContextMenuButton
            testId="go-to-parent"
            icon="folder"
            name={c('Action').t`Go to parent`}
            action={() => navigateToLink(shareId, parentLinkId, false)}
            close={close}
        />
    );
}
