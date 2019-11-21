import React, { useState, useMemo, useRef } from 'react';
import { Loader, classnames } from 'react-components';

import { Element } from '../models/element';

import { useMailboxPageTitle } from '../hooks/useMailboxPageTitle';

import { isColumnMode, isConversationMode } from '../helpers/mailSettings';
import { getHumanLabelID } from '../helpers/labels';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/list/List';
import ConversationView from '../components/conversation/ConversationView';
import PlaceholderView from '../components/view/PlaceholderView';

import './main-area.scss';
import MessageOnlyView from '../components/message/MessageOnlyView';
import { ElementProps } from './ElementsContainer';
import { History, Location } from 'history';

interface Props extends ElementProps {
    labelID: string;
    mailSettings: any;
    elementID?: string;
    location: Location;
    history: History;
}

const MailboxContainer = ({
    labelID,
    mailSettings,
    elementID,
    location,
    history,
    elements,
    loading,
    page,
    setPage,
    total
}: Props) => {
    const [checkedElements, setCheckedElements] = useState(Object.create(null));
    const [checkAll, setCheckAll] = useState(false);
    const [sort, updateSort] = useState();
    const [desc, updateDesc] = useState();
    const [filter] = useState();
    const welcomeRef = useRef(false);

    useMailboxPageTitle(labelID, elements);

    const handleSort = ({ Sort, Desc }: any) => {
        updateDesc(Desc);
        updateSort(Sort);
    };

    const handleFilter = () => {};

    const checkedIDs = useMemo(() => {
        return Object.entries(checkedElements).reduce((acc, [elementID, isChecked]) => {
            if (!isChecked) {
                return acc;
            }
            acc.push(elementID);
            return acc;
        }, [] as string[]);
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

    const handleCheck = (IDs: string[] = [], checked = false) => {
        const update = IDs.reduce((acc, contactID) => {
            acc[contactID] = checked;
            return acc;
        }, Object.create(null));
        setCheckedElements({ ...checkedElements, ...update });
        setCheckAll(checked && IDs.length === elements.length);
    };

    const handleCheckAll = (checked = false) =>
        handleCheck(
            elements.map(({ ID = '' }: Element) => ID),
            checked
        );
    const handleUncheckAll = () => handleCheckAll(false);

    const handleClick = (elementID: string) => {
        history.push({
            ...location,
            pathname: `/${getHumanLabelID(labelID)}/${elementID}`
        });
    };

    const handleBack = () => {
        history.push({
            ...location,
            pathname: `/${getHumanLabelID(labelID)}`
        });
    };

    const columnMode = isColumnMode(mailSettings);
    const conversationMode = isConversationMode(mailSettings);

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
                onBack={handleBack}
                page={page}
                total={total}
                setPage={setPage}
            />
            <div
                className={classnames([
                    'main-area--withToolbar flex-item-fluid flex reset4print',
                    !columnMode && 'main-area--rowMode'
                ])}
            >
                <div className="items-column-list scroll-if-needed scroll-smooth-touch">
                    {loading ? (
                        <div className="flex flex-justify-center h100">
                            <Loader />
                        </div>
                    ) : (
                        (columnMode || !elementID) && (
                            <List
                                labelID={labelID}
                                mailSettings={mailSettings}
                                elementID={elementID}
                                elements={elements}
                                // selectedIDs={selectedIDs}
                                checkedIDs={checkedIDs}
                                onCheck={handleCheck}
                                onClick={handleClick}
                            />
                        )
                    )}
                </div>
                {(columnMode || elementID) && (
                    <section className="view-column-detail p2 flex-item-fluid scroll-if-needed">
                        {elementID ? (
                            conversationMode ? (
                                <ConversationView mailSettings={mailSettings} conversationID={elementID} />
                            ) : (
                                <MessageOnlyView mailSettings={mailSettings} messageID={elementID} />
                            )
                        ) : (
                            <PlaceholderView
                                labelID={labelID}
                                mailSettings={mailSettings}
                                welcomeRef={welcomeRef}
                                checkedIDs={checkedIDs}
                                onUncheckAll={handleUncheckAll}
                            />
                        )}
                    </section>
                )}
            </div>
        </>
    );
};

export default MailboxContainer;
