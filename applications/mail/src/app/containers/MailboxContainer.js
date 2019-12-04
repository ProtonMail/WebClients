import React, { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMailSettings, Loader, classnames } from 'react-components';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/list/List';
import ConversationView from '../components/conversation/ConversationView';
import PlaceholderView from '../components/view/PlaceholderView';
import elements from './elements';
import { LABEL_IDS_TO_HUMAN } from '../constants';
import { VIEW_LAYOUT } from 'proton-shared/lib/constants';

import './main-area.scss';

// eslint-disable-next-line
const MailboxContainer = ({ labelID, elementID, location, history }) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [checkedElements, setCheckedElements] = useState(Object.create(null));
    const [checkAll, setCheckAll] = useState(false);
    const [sort, updateSort] = useState();
    const [desc, updateDesc] = useState();
    const [filter] = useState();
    const welcomeRef = useRef(false);

    const handleSort = ({ Sort, Desc }) => {
        updateDesc(Desc);
        updateSort(Sort);
    };

    const handleFilter = () => {}; // eslint-disable-line
    const handleNext = () => {}; // eslint-disable-line
    const handlePrevious = () => {}; // eslint-disable-line

    const checkedIDs = useMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, []);
    }, [checkedElements]);

    const selectedIDs = useMemo(() => {
        if (checkedIDs.length) {
            return checkedIDs;
        }
        if (elementID) {
            return [elementID];
        }
        return [];
    }, [checkedIDs, location.pathname]);

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

    const handleCheckAll = (checked = false) =>
        handleCheck(
            elements.map(({ ID }) => ID),
            checked
        );
    const handleUncheckAll = () => handleCheckAll(false);

    const handleClick = (elementID) => {
        history.push({
            ...location,
            pathname: `/${LABEL_IDS_TO_HUMAN[labelID] || labelID}/${elementID}`
        });
    };

    const handleBack = () => {
        history.push({
            ...location,
            pathname: `/${LABEL_IDS_TO_HUMAN[labelID] || labelID}`
        });
    };

    const { ViewLayout = VIEW_LAYOUT.COLUMN } = mailSettings;
    const isColumnMode = ViewLayout === VIEW_LAYOUT.COLUMN;

    return (
        <>
            <Toolbar
                labelID={labelID}
                elementID={elementID}
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
                onBack={handleBack}
            />
            <div
                className={classnames([
                    'main-area--withToolbar flex-item-fluid flex reset4print',
                    !isColumnMode && 'main-area--rowMode'
                ])}
            >
                {(isColumnMode || !elementID) && (
                    <List
                        labelID={labelID}
                        mailSettings={mailSettings}
                        elementID={elementID}
                        elements={elements}
                        selectedIDs={selectedIDs}
                        checkedIDs={checkedIDs}
                        onCheck={handleCheck}
                        onClick={handleClick}
                    />
                )}
                {(isColumnMode || elementID) &&
                    (elementID ? (
                        <ConversationView mailSettings={mailSettings} conversationID={elementID} />
                    ) : (
                        <PlaceholderView
                            labelID={labelID}
                            mailSettings={mailSettings}
                            welcomeRef={welcomeRef}
                            checkedIDs={checkedIDs}
                            onUncheckAll={handleUncheckAll}
                        />
                    ))}
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
