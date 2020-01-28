import React, { useEffect, useMemo } from 'react';

import WelcomePane from './WelcomePane';
import SelectionPane from './SelectionPane';
import { ELEMENT_TYPES } from '../../constants';
import { useConversationCounts, useMessageCounts } from 'react-components';
import { getCurrentType } from '../../helpers/elements';
import { LabelCount } from '../../models/label';

interface Props {
    labelID: string;
    checkedIDs?: string[];
    onUncheckAll: () => void;
    welcomeRef: any;
    mailSettings: any;
}

const PlaceholderView = ({ labelID = '', checkedIDs = [], onUncheckAll, welcomeRef, mailSettings }: Props) => {
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();
    const type = getCurrentType({ mailSettings, labelID });

    useEffect(
        () => () => {
            welcomeRef.current = true;
        },
        []
    );

    const labelCount: LabelCount = useMemo(() => {
        const counters = type === ELEMENT_TYPES.CONVERSATION ? conversationCounts : messageCounts;

        if (!Array.isArray(counters)) {
            return 0;
        }

        return counters.find((counter) => counter.LabelID === labelID) || { LabelID: '', Unread: 0, Total: 0 };
    }, [labelID, conversationCounts, messageCounts]);

    return welcomeRef.current || checkedIDs.length > 0 ? (
        <SelectionPane labelCount={labelCount} checkedIDs={checkedIDs} onUncheckAll={onUncheckAll} />
    ) : (
        <WelcomePane labelCount={labelCount} />
    );
};

export default PlaceholderView;
