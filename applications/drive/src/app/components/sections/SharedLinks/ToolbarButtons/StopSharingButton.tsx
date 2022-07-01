import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink, useActions } from '../../../../store';
import { noSelection } from '../../ToolbarButtons/utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const StopSharingButton = ({ shareId, selectedLinks }: Props) => {
    const { stopSharingLinks } = useActions();

    if (noSelection(selectedLinks)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Stop sharing`}
            icon={<Icon name="link-slash" />}
            onClick={() => stopSharingLinks(new AbortController().signal, shareId, selectedLinks)}
            data-testid="toolbar-button-stop-sharing"
        />
    );
};

export default StopSharingButton;
