import { useLocation } from 'react-router';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

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
    const [mailSettings] = useMailSettings();

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
