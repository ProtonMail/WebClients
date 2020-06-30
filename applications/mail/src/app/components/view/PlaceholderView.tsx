import React, { useMemo } from 'react';
import { Location } from 'history';
import { useConversationCounts, useMessageCounts } from 'react-components';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import WelcomePane from './WelcomePane';
import SelectionPane from './SelectionPane';
import { ELEMENT_TYPES } from '../../constants';
import { getCurrentType } from '../../helpers/elements';

interface Props {
    welcomeFlag: boolean;
    labelID: string;
    elementID?: string;
    checkedIDs?: string[];
    onUncheckAll: () => void;
    mailSettings: MailSettings;
    location: Location;
}

const PlaceholderView = ({
    welcomeFlag,
    labelID = '',
    checkedIDs = [],
    onUncheckAll,
    mailSettings,
    location
}: Props) => {
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const type = getCurrentType({ mailSettings, labelID, location });

    const labelCount: LabelCount = useMemo(() => {
        const counters = type === ELEMENT_TYPES.CONVERSATION ? conversationCounts : messageCounts;

        if (!Array.isArray(counters)) {
            return 0;
        }

        return counters.find((counter) => counter.LabelID === labelID) || { LabelID: '', Unread: 0, Total: 0 };
    }, [labelID, conversationCounts, messageCounts]);

    return welcomeFlag ? (
        <WelcomePane mailSettings={mailSettings} location={location} labelCount={labelCount} />
    ) : (
        <SelectionPane
            labelID={labelID}
            mailSettings={mailSettings}
            location={location}
            labelCount={labelCount}
            checkedIDs={checkedIDs}
            onUncheckAll={onUncheckAll}
        />
    );
};

export default PlaceholderView;
