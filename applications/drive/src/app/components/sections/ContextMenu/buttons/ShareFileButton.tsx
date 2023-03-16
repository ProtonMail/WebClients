import { c } from 'ttag';

import ContextMenuButton from '../ContextMenuButton';

interface Props {
    action: () => void;
    close: () => void;
}

const ShareButton = ({ action, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Get link`}
            icon="link"
            testId="context-menu-shareViaLink"
            action={action}
            close={close}
        />
    );
};

export default ShareButton;
