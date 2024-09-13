import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';

import { useModalState } from '../../components/modalTwo';
import { BugModal } from '../support';

const ChallengeError = () => {
    const [bugReportModal, setBugReportModal, render] = useModalState();

    const refresh = (
        <InlineLinkButton key="refresh" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    const supportTeam = (
        <InlineLinkButton
            key="support"
            title="Contact the support team."
            onClick={() => {
                setBugReportModal(true);
            }}
        >
            {c('Info').t`support team`}
        </InlineLinkButton>
    );

    return (
        <>
            {render && <BugModal {...bugReportModal} />}
            <Alert className="mb-4" type="error">
                {c('Error')
                    .jt`Something went wrong, please ${refresh} in order to proceed. If you still see this error message please contact our ${supportTeam}.`}
            </Alert>
        </>
    );
};

export default ChallengeError;
