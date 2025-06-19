import { c } from 'ttag';

import { ImportProvider } from '@proton/activation/src/interface';
import { selectOauthDraftProvider } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms';
import { useModalState } from '@proton/components';

import CustomizeMailImportModal from '../../CustomizeMailImportModal/CustomizeMailImportModal';
import StepPrepareEmailsSummaryText from './StepPrepareOAuthEmailsSummaryText';
import useStepPrepareEmailSummary from './hooks/useStepPrepareOAuthEmailSummary';

interface Props {
    isSelected: boolean;
}

const StepPrepareEmailsSummary = ({ isSelected }: Props) => {
    const provider = useEasySwitchSelector(selectOauthDraftProvider);

    const [displayCustomizeModalProps, handleDisplayCustomizeModal, renderCustomizeModal] = useModalState();
    const { fields, errors, summary, toEmail, handleSubmitCustomizeModal } = useStepPrepareEmailSummary({
        handleCloseCustomizeModal: () => handleDisplayCustomizeModal(false),
    });

    if (!isSelected) {
        return null;
    }

    return (
        <>
            <StepPrepareEmailsSummaryText label={fields.importLabel} errors={errors} summary={summary} />
            <Button
                shape="underline"
                color="norm"
                className="self-start pb-0"
                onClick={() => handleDisplayCustomizeModal(true)}
            >{c('Action').t`Customize`}</Button>
            {renderCustomizeModal && (
                <CustomizeMailImportModal
                    displayCategories={provider === ImportProvider.GOOGLE}
                    fields={fields}
                    foldersOpened={errors.length > 0}
                    importedEmail={toEmail}
                    isLabelMapping={provider === ImportProvider.GOOGLE}
                    modalProps={displayCustomizeModalProps}
                    onSubmit={handleSubmitCustomizeModal}
                />
            )}
        </>
    );
};

export default StepPrepareEmailsSummary;
