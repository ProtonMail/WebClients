import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink, useActions } from '../../../../../store';
import { noSelection } from '../../../ToolbarButtons/utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const StopSharingButtonLEGACY = ({ selectedLinks }: Props) => {
    const { stopSharingLinks, confirmModal } = useActions();

    if (noSelection(selectedLinks)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Stop sharing`}
                icon={<Icon name="link-slash" />}
                onClick={() => stopSharingLinks(new AbortController().signal, selectedLinks)}
                data-testid="toolbar-button-stop-sharing"
            />
            {confirmModal}
        </>
    );
};

export default StopSharingButtonLEGACY;
