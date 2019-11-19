import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useMailSettings, Loader, classnames, useLoading } from 'react-components';

import { Element } from '../models/element';
import { Conversation } from '../models/conversation';
import { Message } from '../models/message';

import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';

import { isColumnMode, isConversationMode } from '../helpers/mailSettings';
import { getHumanLabelID } from '../helpers/labels';

import Toolbar from '../components/toolbar/Toolbar';
import List from '../components/list/List';
import ConversationView from '../components/conversation/ConversationView';
import PlaceholderView from '../components/view/PlaceholderView';

import './main-area.scss';
import MessageOnlyView from '../components/message/MessageOnlyView';

interface Props {
    labelID: string;
    elementID: string;
    location: any;
    history: any;
}

const MailboxContainer = ({ labelID, elementID, location, history }: Props) => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const { getConversations } = useConversations();
    const { getMessages } = useMessages();
    const [loadingElements, withLoadingElements] = useLoading(true);
    const [elements, setElements] = useState<Element[]>([]);
    const [checkedElements, setCheckedElements] = useState(Object.create(null));
    const [checkAll, setCheckAll] = useState(false);
    const [sort, updateSort] = useState();
    const [desc, updateDesc] = useState();
    const [filter] = useState();
    const welcomeRef = useRef(false);

    useEffect(() => {
        if (!loadingMailSettings) {
            const conversationMode = isConversationMode(mailSettings);
            const request = conversationMode ? getConversations : getMessages;
            const load = async () => {
                const result = await request(labelID);
                if (conversationMode) {
                    setElements((result as { Conversations: Conversation[] }).Conversations);
                } else {
                    setElements((result as { Messages: Message[] }).Messages);
                }
            };

            withLoadingElements(load());
        }
    }, [labelID, loadingMailSettings]);

    const handleSort = ({ Sort, Desc }: any) => {
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

    if (loadingMailSettings) {
        return <Loader />;
    }

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
                onNext={handleNext}
                onPrevious={handlePrevious}
                onBack={handleBack}
            />
            <div
                className={classnames([
                    'main-area--withToolbar flex-item-fluid flex reset4print',
                    !columnMode && 'main-area--rowMode'
                ])}
            >
                <div className="items-column-list scroll-if-needed scroll-smooth-touch">
                    {loadingElements ? (
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
