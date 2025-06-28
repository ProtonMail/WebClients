import { useLocation } from 'react-router';

import useMailModel from 'proton-mail/hooks/useMailModel';

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

    if (welcomeFlag) {
        return <WelcomePane mailSettings={mailSettings} location={location} />;
    }

    return (
        <SelectionPane
            labelID={labelID}
            mailSettings={mailSettings}
            location={location}
            checkedIDs={checkedIDs}
            onCheckAll={onCheckAll}
        />
    );
};

export default PlaceholderView;
