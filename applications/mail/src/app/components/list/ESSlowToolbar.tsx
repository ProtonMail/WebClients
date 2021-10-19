import { memo, useMemo } from 'react';
import { c } from 'ttag';
import { InlineLinkButton, useUser } from '@proton/components';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { sendSlowSearchReport } from '../../helpers/encryptedSearch/esSearch';

const ESSlowToolbar = () => {
    const [{ ID: userID }] = useUser();
    const { openDropdown } = useEncryptedSearchContext();

    useMemo(() => {
        sendSlowSearchReport(userID);
    }, []);

    return (
        <div className="sticky-top bg-norm border-bottom--weak p0-5 flex flex-wrap flex-justify-center">
            {c('Info').t`Taking too long?`}
            <InlineLinkButton onClick={openDropdown} className="pl0-25">
                {c('Action').t`Refine your search`}
            </InlineLinkButton>
        </div>
    );
};

export default memo(ESSlowToolbar);
