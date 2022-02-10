import { c } from 'ttag';

import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import useNavigate from '../../../../hooks/drive/useNavigate';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    parentLinkId: string;
    close: () => void;
}

export default function GoToParent({ shareId, parentLinkId, close }: Props) {
    const { navigateToLink } = useNavigate();

    return (
        <ContextMenuButton
            testId="go-to-parent"
            icon="folder"
            name={c('Action').t`Go to parent`}
            action={() => navigateToLink(shareId, parentLinkId, LinkType.FOLDER)}
            close={close}
        />
    );
}
