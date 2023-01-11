import { IMPORT_ERROR, ImportProvider } from '@proton/activation/interface';
import { selectImapDraftProvider } from '@proton/activation/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/logic/store';

import StepFormErrorDefault from './StepFormErrorDefault';
import StepFormErrorYahoo from './StepFormErrorYahoo';

interface Props {
    isReconnect: boolean;
    errorCode?: IMPORT_ERROR;
}

const StepFormError = ({ isReconnect, errorCode }: Props) => {
    const provider = useEasySwitchSelector(selectImapDraftProvider);

    if (provider === ImportProvider.YAHOO) {
        return <StepFormErrorYahoo isReconnect={isReconnect} errorCode={errorCode} />;
    }

    return <StepFormErrorDefault isReconnect={isReconnect} errorCode={errorCode} />;
};

export default StepFormError;
