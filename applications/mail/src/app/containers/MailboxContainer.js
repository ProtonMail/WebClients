import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMailSettings, Loader } from 'react-components';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/list/List';
import View from '../components/view/View';
import ViewPlaceholder from '../components/view/ViewPlaceholder';
import elements from './elements';

// eslint-disable-next-line
const MailboxContainer = ({ labelID, elementID, location, history }) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [checkedElements, setCheckedElements] = useState(Object.create(null));
    const [checkAll, setCheckAll] = useState(false);
    const [sort, updateSort] = useState();
    const [desc, updateDesc] = useState();
    const [filter] = useState();

    const handleSort = ({ Sort, Desc }) => {
        updateDesc(Desc);
        updateSort(Sort);
    };

    const handleFilter = () => {};
    const handleNext = () => {};
    const handlePrevious = () => {};

    const checkedElementIDs = useMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, []);
    }, [checkedElements]);

    const selectedIDs = useMemo(() => {
        if (checkedElementIDs.length) {
            return checkedElementIDs;
        }
        if (elementID) {
            return [elementID];
        }
        return [];
    }, [checkedElementIDs, location.pathname]);

    if (loadingMailSettings) {
        return <Loader />;
    }

    const handleCheck = (IDs = [], checked = false) => {
        const update = IDs.reduce((acc, contactID) => {
            acc[contactID] = checked;
            return acc;
        }, Object.create(null));
        setCheckedElements({ ...checkedElements, ...update });
        setCheckAll(checked && IDs.length === elements.length);
    };
    const handleCheckAll = (checked = false) => handleCheck(elements.map(({ ID }) => ID), checked);
    const handleUncheckAll = () => handleCheckAll(false);

    return (
        <>
            <Toolbar
                labelID={labelID}
                selectedIDs={selectedIDs}
                mailSettings={mailSettings}
                checkAll={checkAll}
                onCheckAll={handleCheckAll}
                onSort={handleSort}
                sort={sort}
                desc={desc}
                onFilter={handleFilter}
                filter={filter}
                onNext={handleNext}
                onPrevious={handlePrevious}
            />
            <div className="main-area--withToolbar flex-item-fluid flex reset4print">
                <List
                    labelID={labelID}
                    mailSettings={mailSettings}
                    elementID={elementID}
                    elements={elements}
                    selectedIDs={selectedIDs}
                    onCheck={handleCheck}
                />
                {elementID ? (
                    <View mailSettings={mailSettings} elementID={elementID} />
                ) : (
                    <ViewPlaceholder selectedIDs={selectedIDs} onUncheckAll={handleUncheckAll} />
                )}
            </div>
        </>
    );
};

MailboxContainer.propTypes = {
    labelID: PropTypes.string,
    elementID: PropTypes.string,
    location: PropTypes.object,
    history: PropTypes.object
};

export default MailboxContainer;
