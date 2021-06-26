import React, { useMemo } from 'react';
import { useLocation } from 'react-router';
import { useConversationCounts, useMailSettings, useMessageCounts } from 'react-components';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';
import WelcomePane from './WelcomePane';
import SelectionPane from './SelectionPane';
import { ELEMENT_TYPES } from '../../constants';
import { getCurrentType } from '../../helpers/elements';

interface Props {
    welcomeFlag: boolean;
    labelID: string;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const PlaceholderView = ({ welcomeFlag, labelID = '', checkedIDs = [], onCheckAll }: Props) => {
    const location = useLocation();
    const [mailSettings] = useMailSettings();
    const [conversationCounts = []] = useConversationCounts() as [LabelCount[] | undefined, boolean, Error];
    const [messageCounts = []] = useMessageCounts() as [LabelCount[] | undefined, boolean, Error];
    const type = getCurrentType({ mailSettings, labelID, location });

    const labelCount = useMemo(() => {
        const counters = type === ELEMENT_TYPES.CONVERSATION ? conversationCounts : messageCounts;
        return counters.find((counter) => counter.LabelID === labelID);
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
            onCheckAll={onCheckAll}
        />
    );
};

export default PlaceholderView;
