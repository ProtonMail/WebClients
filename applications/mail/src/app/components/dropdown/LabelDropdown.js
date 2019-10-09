import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    SearchInput,
    Icon,
    useLabels,
    useModals,
    PrimaryButton,
    classnames,
    Tooltip,
    useLoading,
    useApi,
    useNotifications,
    Checkbox
} from 'react-components';
import { LABEL_EXCLUSIVE } from 'proton-shared/lib/constants';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { c } from 'ttag';
import { normalize } from 'proton-shared/lib/helpers/string';

import './LabelDropdown.scss';
import { ELEMENT_TYPES } from '../../constants';

const LabelDropdown = ({ selectedIDs = [], type }) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { createModal } = useModals();
    const [labels = []] = useLabels();
    const [search, updateSearch] = useState('');
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [selectedLabelIDs, updateSelectedLabelIDs] = useState({}); // TODO
    const normSearch = normalize(search);
    const list = labels
        .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.LABEL)
        .map((folder) => ({ ...folder, icon: 'label' }))
        .filter(({ Name = '' }) => {
            if (!search) {
                return true;
            }
            const normName = normalize(Name);
            return normName.includes(normSearch);
        });

    const handleApply = async () => {
        const labelAction = type === ELEMENT_TYPES.MESSAGE ? labelMessages : labelConversations;
        const unlabelAction = type === ELEMENT_TYPES.MESSAGE ? unlabelMessages : unlabelConversations;
        // TODO to improve: we call label / unlabel too much
        const promises = list.map(({ ID: LabelID }) => {
            if (selectedLabelIDs[LabelID]) {
                return api(labelAction({ LabelID, IDs: selectedIDs }));
            } else {
                return api(unlabelAction({ LabelID, IDs: selectedIDs }));
            }
        });
        await Promise.all(promises);
        createNotification({ text: c('Success').t`Labels applied` });
    };

    const handleCheck = ({ target, nativeEvent }) => {
        const { shiftKey } = nativeEvent;
        const labelID = target.getAttribute('data-label-id');
        const labelIDs = [labelID];

        if (lastChecked && shiftKey) {
            const start = list.findIndex(({ ID }) => ID === labelID);
            const end = list.findIndex(({ ID }) => ID === lastChecked);
            labelIDs.push(...list.slice(Math.min(start, end), Math.max(start, end) + 1).map(({ ID }) => ID));
        }

        setLastChecked(labelID);
        const update = labelIDs.reduce((acc, ID) => {
            acc[ID] = target.checked;
            return acc;
        }, Object.create(null));
        updateSelectedLabelIDs({ ...selectedLabelIDs, ...update });
    };

    return (
        <div className="p1">
            <div className="flex flex-spacebetween flex-items-center mb1">
                <label htmlFor="filter-labels" className="bold">{c('Label').t`Label as`}</label>
                <Tooltip title={c('Title').t`Create label`}>
                    <PrimaryButton
                        className="pm-button--small pm-button--for-smallicon"
                        onClick={() => {
                            createModal(); // TODO
                        }}
                    >
                        <Icon name="label" fill="light" className="flex-item-noshrink mr0-25" />+
                    </PrimaryButton>
                </Tooltip>
            </div>
            <div className="mb1">
                <SearchInput
                    autoFocus={true}
                    value={search}
                    onChange={updateSearch}
                    id="filter-labels"
                    placeholder={c('Placeholder').t`Filter labels`}
                />
            </div>
            <div className="scroll-if-needed scroll-smooth-touch mb1 labelDropdown-list-container">
                <ul className="unstyled mt0 mb0">
                    {list.map(({ ID = '', Name = '', Color = '', icon }, index) => {
                        return (
                            <li
                                key={ID}
                                className={classnames([
                                    'w100 flex flex-nowrap flex-spacebetween flex-items-center pt0-5 pb0-5',
                                    index < list.length - 1 && 'border-bottom'
                                ])}
                            >
                                <div className="flex flex-nowrap flex-spacebetween flex-items-center">
                                    <Icon name={icon} color={Color} className="flex-item-noshrink mr0-5" />
                                    <label htmlFor={ID} title={Name} className="ellipsis">
                                        {Name}
                                    </label>
                                </div>
                                <Checkbox
                                    className="flex-item-noshrink"
                                    id={ID}
                                    checked={selectedLabelIDs[ID] || false}
                                    data-label-id={ID}
                                    onChange={handleCheck}
                                />
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="mb1 flex flex-spacebetween">
                <label htmlFor="alsoArchive">{c('Label').t`Also archive`}</label>
                <Checkbox
                    id="alsoArchive"
                    checked={alsoArchive}
                    onChange={({ target }) => updateAlsoArchive(target.checked)}
                />
            </div>
            <div>
                <PrimaryButton className="w100" loading={loading} onClick={() => withLoading(handleApply())}>{c(
                    'Action'
                ).t`Apply`}</PrimaryButton>
            </div>
        </div>
    );
};

LabelDropdown.propTypes = {
    selectedIDs: PropTypes.arrayOf(PropTypes.string),
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired
};

export default LabelDropdown;
