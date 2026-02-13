import { c, msgid } from 'ttag';

import type { MailImportFields } from '@proton/activation/src/components/Modals/CustomizeMailImportModal/CustomizeMailImportModal.interface';
import { getMailMappingErrors } from '@proton/activation/src/helpers/getMailMappingErrors';
import { ImportProvider } from '@proton/activation/src/interface';
import { updateEmailsData } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateImporterData,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';

interface Props {
    handleCloseCustomizeModal: () => void;
}

const useStepPrepareEmailSummary = ({ handleCloseCustomizeModal }: Props) => {
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const dispatch = useEasySwitchDispatch();

    const importerData = useEasySwitchSelector(selectOauthImportStateImporterData);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const toEmail = importerData?.importedEmail;
    const storeFields = importerData?.emails?.fields;
    if (!storeFields || !toEmail || !provider) {
        throw new Error('Folders or importedEmail should be defined');
    }

    const isLabelMapping = provider === ImportProvider.GOOGLE;

    const itemsToImportCount = storeFields.mapping.filter((item) => !item?.category).length;
    const selectedItemsToImportCount = storeFields.mapping.filter((item) => item.checked && !item?.category).length;
    const errors = getMailMappingErrors(storeFields.mapping, isLabelMapping, labels, folders);

    const summaryAllLabels = isLabelMapping
        ? // translator: here is an example of a complete sentence: "Import all messages from 12 labels and label them as ..." followed by the label HTML element
          c('Mail import summary').ngettext(
              msgid`Import all messages from ${itemsToImportCount} label and label them as`,
              `Import all messages from ${itemsToImportCount} labels and label them as`,
              itemsToImportCount
          )
        : // translator: here is an example of a complete sentence: "Import all messages from 12 folders and label them as ..." followed by the label HTML element
          c('Mail import summary').ngettext(
              msgid`Import all messages from ${itemsToImportCount} folder and label them as`,
              `Import all messages from ${itemsToImportCount} folders and label them as`,
              itemsToImportCount
          );

    const summarySelectedLabels = isLabelMapping
        ? // translator: here is an example of a complete sentence: "Import all messages from 3 out of 5 labels and label them as ..." followed by the label HTML element
          c('Mail import summary').ngettext(
              msgid`Import all messages from ${selectedItemsToImportCount} out of ${itemsToImportCount} label and label them as`,
              `Import all messages from ${selectedItemsToImportCount} out of ${itemsToImportCount} labels and label them as`,
              itemsToImportCount
          )
        : // translator: here is an example of a complete sentence: "Import all messages from 3 out of 5 folders and label them as ..." followed by the label HTML element
          c('Mail import summary').ngettext(
              msgid`Import all messages from ${selectedItemsToImportCount} out of ${itemsToImportCount} folder and label them as`,
              `Import all messages from ${selectedItemsToImportCount} out of ${itemsToImportCount} folders and label them as`,
              itemsToImportCount
          );

    const summary = itemsToImportCount === selectedItemsToImportCount ? summaryAllLabels : summarySelectedLabels;

    const handleSubmitCustomizeModal = (updatedFields: MailImportFields) => {
        dispatch(updateEmailsData(updatedFields));
        handleCloseCustomizeModal();
    };

    return { fields: storeFields, errors: errors.errors, summary, toEmail, handleSubmitCustomizeModal };
};

export default useStepPrepareEmailSummary;
