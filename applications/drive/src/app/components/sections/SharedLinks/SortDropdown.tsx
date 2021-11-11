import SortDropdown from '../SortDropdown';
import { useSharedLinksContent } from './SharedLinksContentProvider';

const SortDropdownLinks = () => {
    const { sortParams, setSorting } = useSharedLinksContent();

    return (
        <SortDropdown
            sortFields={['Name', 'CreateTime', 'ExpireTime']}
            sortParams={sortParams}
            setSorting={setSorting}
        />
    );
};

export default SortDropdownLinks;
