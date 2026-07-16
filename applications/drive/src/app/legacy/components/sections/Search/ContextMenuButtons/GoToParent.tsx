import { c } from 'ttag';

import { IcFolder } from '@proton/icons/icons/IcFolder';

import useDriveNavigation from '../../../../../legacy/hooks/drive/useNavigate';
import { ContextMenuButton } from '../../../../../statelessComponents/ContextMenu';

interface Props {
    shareId: string;
    parentLinkId: string;
    close: () => void;
}

export default function GoToParent({ shareId, parentLinkId, close }: Props) {
    const { navigateToLink } = useDriveNavigation();
    const title = c('Action').t`Go to parent`;

    return (
        <ContextMenuButton
            testId="go-to-parent"
            icon={<IcFolder />}
            name={title}
            action={() => navigateToLink(shareId, parentLinkId, false)}
            close={close}
        />
    );
}
