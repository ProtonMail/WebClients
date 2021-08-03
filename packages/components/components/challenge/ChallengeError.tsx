import { c } from 'ttag';
import { Alert } from '../alert';
import { InlineLinkButton } from '../button';
import { BugModal } from '../../containers';
import { useModals } from '../../hooks';

const ChallengeError = () => {
    const { createModal } = useModals();

    const refresh = (
        <InlineLinkButton key="refresh" onClick={() => window.location.reload()}>{c('Action')
            .t`refresh the page`}</InlineLinkButton>
    );

    const supportTeam = (
        <InlineLinkButton
            key="support"
            title="Contact the support team."
            onClick={() => {
                createModal(<BugModal />);
            }}
        >
            {c('Info').t`support team`}
        </InlineLinkButton>
    );

    return (
        <Alert type="error">
            {c('Error')
                .jt`Something went wrong, please ${refresh} in order to proceed. If you still see this error message please contact our ${supportTeam}.`}
        </Alert>
    );
};

export default ChallengeError;
