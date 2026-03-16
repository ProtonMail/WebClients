import { selectDraftModal } from '@proton/activation/src/logic/draft/draft.selector';
import { readImapInstructions, resetImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';

import CalendarModal from './Imap/CalendarModal/CalendarModal';
import ImapMailModal from './Imap/ImapMailModal/ImapMailModal';
import InstructionsModal from './Imap/InstructionsModal/InstructionsModal';
import OAuthModal from './OAuth/OAuthModal';

import './MainModal.scss';

const MainModal = () => {
    const dispatch = useEasySwitchDispatch();
    const modal = useEasySwitchSelector(selectDraftModal);

    if (modal === 'read-instructions') {
        return (
            <InstructionsModal
                onClose={() => dispatch(resetImapDraft())}
                onSubmit={() => {
                    dispatch(readImapInstructions());
                }}
            />
        );
    }

    if (modal === 'import-Mail') {
        return <ImapMailModal />;
    }

    if (modal === 'import-Calendar') {
        return <CalendarModal onClose={() => dispatch(resetImapDraft())} />;
    }

    if (modal === 'import-Contacts') {
        return <ContactImportModal open onClose={() => dispatch(resetImapDraft())} />;
    }

    if (modal === 'oauth') {
        return <OAuthModal />;
    }

    return null;
};

export default MainModal;
