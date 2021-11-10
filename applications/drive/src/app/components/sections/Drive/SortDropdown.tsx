import { useDriveContent } from './DriveContentProvider';
import SortDropdown from '../SortDropdown';

const SortDropdownDrive = () => {
    const { sortParams, setSorting } = useDriveContent();

    return <SortDropdown sortFields={['Name', 'ModifyTime', 'Size']} sortParams={sortParams} setSorting={setSorting} />;
};

export default SortDropdownDrive;
