import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';
import {
    SearchInput as UntypedSearchInput,
    Icon,
    useLabels,
    useModals,
    PrimaryButton,
    LabelModal,
    classnames,
    Tooltip,
    useLoading,
    useApi,
    useNotifications,
    Checkbox,
    useEventManager,
    generateUID
} from 'react-components';
import { LABEL_EXCLUSIVE } from 'proton-shared/lib/constants';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { normalize } from 'proton-shared/lib/helpers/string';

import { ELEMENT_TYPES } from '../../constants';
import { Label } from '../../models/label';

import './LabelDropdown.scss';

const SearchInput = UntypedSearchInput as any;

interface Props {
    selectedIDs: string[];
    type: string;
    onClose: () => void;
}

const LabelDropdown = ({ selectedIDs = [], type, onClose }: Props) => {
    const [uid] = useState(generateUID('label-dropdown'));
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [labels = []]: [Label[]] = useLabels();
    const [search, updateSearch] = useState('');
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [selectedLabelIDs, updateSelectedLabelIDs] = useState<{ [labelID: string]: boolean }>({}); // TODO

    const normSearch = normalize(search);
    const list = labels
        .filter(({ Exclusive }) => Exclusive === LABEL_EXCLUSIVE.LABEL)
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
        const promises = list.map(({ ID: LabelID = '' }) => {
            if (selectedLabelIDs[LabelID]) {
                return api(labelAction({ LabelID, IDs: selectedIDs }));
            } else {
                return api(unlabelAction({ LabelID, IDs: selectedIDs }));
            }
        });
        await Promise.all(promises);
        await call();
        onClose();
        createNotification({ text: c('Success').t`Labels applied` });
    };

    const handleCheck = (labelID: string) => ({ target, nativeEvent }: ChangeEvent) => {
        const { shiftKey } = nativeEvent as any;
        const labelIDs = [labelID];

        if (lastChecked && shiftKey) {
            const start = list.findIndex(({ ID }) => ID === labelID);
            const end = list.findIndex(({ ID }) => ID === lastChecked);
            labelIDs.push(...list.slice(Math.min(start, end), Math.max(start, end) + 1).map(({ ID = '' }) => ID));
        }

        setLastChecked(labelID);
        const update = labelIDs.reduce((acc, ID) => {
            acc[ID] = (target as HTMLInputElement).checked;
            return acc;
        }, Object.create(null));

        console.log('handleCheck', selectedLabelIDs, update);

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
                            createModal(<LabelModal type="label" label={null} />);
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
                    {list.map(({ ID = '', Name = '', Color = '' }, index) => {
                        // The dropdown is several times in the view, native html ids has to be different each time
                        const lineId = `${uid}-${ID}`;
                        return (
                            <li
                                key={lineId}
                                className={classnames([
                                    'w100 flex flex-nowrap flex-spacebetween flex-items-center pt0-5 pb0-5',
                                    index < list.length - 1 && 'border-bottom'
                                ])}
                            >
                                <div className="flex flex-nowrap flex-spacebetween flex-items-center">
                                    <Icon name="label" color={Color} className="flex-item-noshrink mr0-5" />
                                    <label htmlFor={lineId} title={Name} className="ellipsis">
                                        {Name}
                                    </label>
                                </div>
                                <Checkbox
                                    className="flex-item-noshrink"
                                    id={lineId}
                                    checked={selectedLabelIDs[ID] || false}
                                    onChange={handleCheck(ID)}
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
                <PrimaryButton className="w100" loading={loading} onClick={() => withLoading(handleApply())}>
                    {c('Action').t`Apply`}
                </PrimaryButton>
            </div>
        </div>
    );
};

export default LabelDropdown;
