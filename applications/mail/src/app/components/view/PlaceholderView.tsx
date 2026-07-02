import SelectionPane from './SelectionPane';
import WelcomePane from './WelcomePane';

interface Props {
    welcomeFlag: boolean;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const PlaceholderView = ({ welcomeFlag, checkedIDs = [], onCheckAll }: Props) => {
    if (welcomeFlag) {
        return <WelcomePane />;
    }

    return <SelectionPane checkedIDs={checkedIDs} onCheckAll={onCheckAll} />;
};

export default PlaceholderView;
