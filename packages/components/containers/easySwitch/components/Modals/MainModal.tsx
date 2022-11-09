import ContactImportModal from '@proton/components/containers/contacts/import/ContactImportModal';

import { readInstructions, resetDraft, selectProductToImport } from '../../logic/draft/draft.actions';
import { selectDraftModal } from '../../logic/draft/draft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../logic/store';
import { ImportType } from '../../logic/types/shared.types';
import CalendarModal from './Imap/CalendarModal';
import ImapModal from './Imap/ImapModal';
import InstructionsModal from './Imap/InstructionModal';
import MailModal from './Imap/MailModal';
import OauthModal from './Oauth/OauthModal';

import './MainModal.scss';

const MainModal = () => {
    const dispatch = useEasySwitchDispatch();
    const modal = useEasySwitchSelector(selectDraftModal);

    const onClose = () => {
        dispatch(resetDraft());
    };

    if (modal === 'select-product') {
        return (
            <ImapModal
                onClick={(selectedProduct: ImportType) => {
                    dispatch(selectProductToImport({ importType: selectedProduct }));
                }}
                onClose={onClose}
            />
        );
    }

    if (modal === 'read-instructions') {
        return (
            <InstructionsModal
                onClose={onClose}
                onSubmit={() => {
                    dispatch(readInstructions(true));
                }}
            />
        );
    }

    if (modal === 'import-Mail') {
        return <MailModal onClose={onClose} />;
    }

    if (modal === 'import-Calendar') {
        return <CalendarModal onClose={onClose} />;
    }

    if (modal === 'import-Contacts') {
        return <ContactImportModal open onClose={onClose} />;
    }

    if (modal === 'oauth') {
        return <OauthModal onClose={onClose} />;
    }

    return null;
};

export default MainModal;
