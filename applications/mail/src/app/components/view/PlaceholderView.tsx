import SelectionPane from './SelectionPane';
import WelcomePane from './WelcomePane';

interface Props {
    welcomeFlag: boolean;
    labelID: string;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const PlaceholderView = ({ welcomeFlag, labelID = '', checkedIDs = [], onCheckAll }: Props) => {
    if (welcomeFlag) {
        return <WelcomePane />;
    }

    return <SelectionPane labelID={labelID} checkedIDs={checkedIDs} onCheckAll={onCheckAll} />;
};

export default PlaceholderView;
