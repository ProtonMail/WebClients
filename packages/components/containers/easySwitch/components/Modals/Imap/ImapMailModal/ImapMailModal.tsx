import { useAddresses } from '@proton/components/hooks';
import noop from '@proton/utils/noop';

import { selectImapDraftProvider } from '../../../../logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchSelector } from '../../../../logic/store';
import ImportMailModal from '../../../../mail/modals/ImportMailModal';
import { newToOldImapProvider } from '../../../../utils';

interface Props {
    onClose: () => void;
}

const ImapMailModal = ({ onClose }: Props) => {
    const [adresses, loadingAddresses] = useAddresses();
    const provider = useEasySwitchSelector(selectImapDraftProvider);

    const displayModal = !loadingAddresses && !!provider;

    return displayModal ? (
        <ImportMailModal
            onExit={noop}
            onClose={onClose}
            addresses={adresses}
            provider={newToOldImapProvider(provider)}
        />
    ) : null;
};

export default ImapMailModal;
