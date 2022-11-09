import { useAddresses } from '@proton/components/hooks';
import noop from '@proton/utils/noop';

import { DraftStep } from '../../../logic/draft/draft.interface';
import { selectDraftUi } from '../../../logic/draft/draft.selector';
import { useEasySwitchSelector } from '../../../logic/store';
import ImportMailModal from '../../../mail/modals/ImportMailModal';
import { newToOldImapProvider } from '../../../utils';

interface Props {
    onClose: () => void;
}

const MailModal = ({ onClose }: Props) => {
    const [adresses, loading] = useAddresses();
    const ui = useEasySwitchSelector(selectDraftUi);
    const provider = ui.step === DraftStep.START ? ui.provider : undefined;

    const displayModal = !loading && provider;

    return displayModal ? (
        <ImportMailModal
            onExit={noop}
            onClose={onClose}
            addresses={adresses}
            provider={newToOldImapProvider(provider)}
        />
    ) : null;
};

export default MailModal;
