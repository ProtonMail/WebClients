import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { useMessageCounts } from '@proton/components';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { ELEMENT_TYPES } from '../../constants';
import { getCurrentType } from '../../helpers/elements';
import SelectionPane from './SelectionPane';
import WelcomePane from './WelcomePane';

interface Props {
    welcomeFlag: boolean;
    labelID: string;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const PlaceholderView = ({ welcomeFlag, labelID = '', checkedIDs = [], onCheckAll }: Props) => {
    const location = useLocation();
    const mailSettings = useMailModel('MailSettings');
    const [conversationCounts = []] = useConversationCounts();
    const [messageCounts = []] = useMessageCounts();
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
