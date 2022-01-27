import { memo, useMemo } from 'react';
import { c } from 'ttag';
import { InlineLinkButton, useUser } from '@proton/components';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { sendSlowSearchReport } from '../../helpers/encryptedSearch/esSearch';

const ESSlowToolbar = () => {
    const [{ ID: userID }] = useUser();
    const { openDropdown, setTemporaryToggleOff } = useEncryptedSearchContext();

    useMemo(() => {
        sendSlowSearchReport(userID);
    }, []);

    const dropdownButton = (
        <InlineLinkButton className="pl0-25 pr0-25" onClick={openDropdown} key="dropdownButton">
            {
                // translator: sentence appears when a message content search takes too long . Complete sentence example: "Search taking too long? <Refine it> or <exclude message content> from this search session.
                c('Action').t`Refine it`
            }
        </InlineLinkButton>
    );
    const toggleOffButton = (
        <InlineLinkButton className="pl0-25 pr0-25" onClick={setTemporaryToggleOff} key="toggleOffButton">
            {
                // translator: sentence appears when a message content search takes too long . Complete sentence example: "Search taking too long? <Refine it> or <exclude message content> from this search session.
                c('Action').t`exclude message content`
            }
        </InlineLinkButton>
    );

    return (
        <div className="sticky-top bg-norm border-bottom border-weak p0-5 flex flex-wrap flex-justify-center">
            {
                // translator: sentence appears when a message content search takes too long . Complete sentence example: "Search taking too long? <Refine it> or <exclude message content> from this search session.
                c('Info').jt`Search taking too long? ${dropdownButton} or ${toggleOffButton} from this search session.`
            }
        </div>
    );
};

export default memo(ESSlowToolbar);
