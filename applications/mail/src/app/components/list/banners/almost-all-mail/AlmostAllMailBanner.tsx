import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { Icon } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { changeSearchParams } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { getHumanLabelID } from 'proton-mail/helpers/labels';

interface Props {
    className?: string;
}

const AlmostAllMailBanner = ({ className }: Props) => {
    const history = useHistory();
    const { push, location } = history;

    const displayAllMailButton = (
        <InlineLinkButton
            key="redirect-all-mail"
            onClick={() => {
                push(changeSearchParams(`/${getHumanLabelID(MAILBOX_LABEL_IDS.ALL_MAIL)}`, location.hash));
            }}
        >{c('Info').t`Include Spam/Trash.`}</InlineLinkButton>
    );

    return (
        <div className={clsx(['rounded mx-2 px-4 py-2 flex flex-nowrap mb-2', className])}>
            <div className="shrink-0">
                <Icon name="magnifier" className="mr-2" />
            </div>
            <div className="flex-1 pl-1">
                {
                    // translator: sentence appear when a user has AlmostAllMail setting on, excluding spam/trash. Complete sentence example: "Can't find what you're looking for? <Include Spam/Trash.>"
                    c('Info').jt`Can't find what you're looking for? ${displayAllMailButton}`
                }
            </div>
        </div>
    );
};

export default AlmostAllMailBanner;
