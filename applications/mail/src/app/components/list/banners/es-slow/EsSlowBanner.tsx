import { memo, useMemo } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { sendSlowSearchReport } from '@proton/encrypted-search/esHelpers';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import clsx from '@proton/utils/clsx';

import { useEncryptedSearchContext } from '../../../../containers/EncryptedSearchProvider';

interface Props {
    className?: string;
}

const EsSlowBanner = ({ className }: Props) => {
    const [{ ID: userID }] = useUser();
    const { openDropdown, setTemporaryToggleOff } = useEncryptedSearchContext();

    useMemo(() => {
        void sendSlowSearchReport(userID);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-2EAF2D
    }, []);

    const dropdownButton = (
        <InlineLinkButton className="px-1" onClick={openDropdown} key="dropdownButton">
            {
                // translator: sentence appears when a message content search takes too long . Complete sentence example: "Search taking too long? <Refine it> or <exclude message content> from this search session.
                c('Action').t`Refine it`
            }
        </InlineLinkButton>
    );
    const toggleOffButton = (
        <InlineLinkButton className="px-1" onClick={setTemporaryToggleOff} key="toggleOffButton">
            {
                // translator: sentence appears when a message content search takes too long . Complete sentence example: "Search taking too long? <Refine it> or <exclude message content> from this search session.
                c('Action').t`exclude message content`
            }
        </InlineLinkButton>
    );

    return (
        <div className={clsx(['rounded mx-2 px-4 py-2 flex flex-nowrap mb-2', className])}>
            <div className="shrink-0">
                <IcMagnifier className="mr-2" />
            </div>
            <div className="flex-1 pl-1">
                {
                    // translator: sentence appears when a message content search takes too long . Complete sentence example: "Search taking too long? <Refine it> or <exclude message content> from this search session.
                    c('Info')
                        .jt`Search taking too long? ${dropdownButton} or ${toggleOffButton} from this search session.`
                }
            </div>
        </div>
    );
};

export default memo(EsSlowBanner);
