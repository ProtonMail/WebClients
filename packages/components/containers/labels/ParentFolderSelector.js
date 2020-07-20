import React from 'react';
import PropTypes from 'prop-types';
import { useFolders, Loader, Select } from 'react-components';
import { buildTreeview, formatFolderName } from 'proton-shared/lib/helpers/folder';
import { ROOT_FOLDER } from 'proton-shared/lib/constants';
import { c } from 'ttag';

// ROOT_FOLDER is transformed to a String when coming from target.value
const formatValue = (value) => (value === `${ROOT_FOLDER}` ? ROOT_FOLDER : value);

const ParentFolderSelector = ({ id, value, onChange, className, disableOptions = [] }) => {
    const [folders, loading] = useFolders();

    if (loading) {
        return <Loader />;
    }

    const formatOption = ({ Name, ID }, level = 0) => ({
        disabled: disableOptions.includes(ID),
        value: ID,
        text: formatFolderName(level, Name, ' ∙ '),
    });

    const reducer = (acc = [], folder, level = 0) => {
        acc.push(formatOption(folder, level));

        if (Array.isArray(folder.subfolders)) {
            folder.subfolders.forEach((folder) => reducer(acc, folder, level + 1));
        }

        return acc;
    };

    const treeview = buildTreeview(folders);
    const options = treeview.reduce((acc, folder) => reducer(acc, folder), [
        { value: ROOT_FOLDER, text: c('Option').t`No parent folder` },
    ]);

    return (
        <Select
            id={id}
            className={className}
            value={value}
            options={options}
            onChange={({ target }) => onChange && onChange(formatValue(target.value))}
        />
    );
};

ParentFolderSelector.propTypes = {
    id: PropTypes.string,
    className: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onChange: PropTypes.func,
    disableOptions: PropTypes.arrayOf(PropTypes.string),
};

export default ParentFolderSelector;
