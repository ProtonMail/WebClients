import { selectSearch } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import SelectionPane from './SelectionPane';
import WelcomePane from './WelcomePane';

interface Props {
    welcomeFlag: boolean;
    checkedIDs?: string[];
    onCheckAll: (checked: boolean) => void;
}

const PlaceholderView = ({ welcomeFlag, checkedIDs = [], onCheckAll }: Props) => {
    const search = useMailSelector(selectSearch);
    if (welcomeFlag && !search) {
        return <WelcomePane />;
    }

    return <SelectionPane checkedIDs={checkedIDs} onCheckAll={onCheckAll} />;
};

export default PlaceholderView;
