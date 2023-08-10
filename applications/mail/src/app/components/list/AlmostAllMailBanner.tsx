import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Icon, InlineLinkButton } from '@proton/components/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';

import { getHumanLabelID } from 'proton-mail/helpers/labels';

const ALMOST_ALL_MAIL_PATHNAME = `/${getHumanLabelID(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)}`;

const AlmostAllMailBanner = () => {
    const history = useHistory();

    const { push, location } = history;

    if (!location.pathname.startsWith(ALMOST_ALL_MAIL_PATHNAME)) {
        return null;
    }

    const displayAllMailButton = (
        <InlineLinkButton
            key="redirect-all-mail"
            onClick={() => {
                push(changeSearchParams(`/${getHumanLabelID(MAILBOX_LABEL_IDS.ALL_MAIL)}`, location.hash));
            }}
        >{c('Info').t`Include Spam/Trash in your search results.`}</InlineLinkButton>
    );

    return (
        <div className="bg-weak rounded m-4 px-4 py-2 flex flex-nowrap">
            <div className="flex-item-noshrink">
                <Icon name="magnifier" className="mr-2" />
            </div>
            <div className="flex-item-fluid pl-1">
                {
                    // translator: sentence appear when a user has AlmostAllMail setting on, excluding spam/trash for the search results. Complete sentence example: "Don't find what you are looking for? <Include Spam/Trash in your search results.>"
                    c('Info').jt`Don't find what you are looking for? ${displayAllMailButton}`
                }
            </div>
        </div>
    );
};

export default AlmostAllMailBanner;
