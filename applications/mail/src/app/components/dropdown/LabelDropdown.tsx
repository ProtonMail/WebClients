import React, { useState, ChangeEvent, useEffect } from 'react';
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
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { normalize } from 'proton-shared/lib/helpers/string';
import { LABEL_COLORS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';

import { Label } from '../../models/label';
import { Element } from '../../models/element';
import { hasLabel, isMessage } from '../../helpers/elements';
import { getLabelsWithoutFolders } from '../../helpers/labels';

import './LabelDropdown.scss';

const SearchInput = UntypedSearchInput as any;

enum LabelState {
    On,
    Off,
    Indeterminate
}

type SelectionState = { [labelID: string]: LabelState };

const getInitialState = (labels: Label[] = [], elements: Element[] = []) => {
    const result: SelectionState = {};
    getLabelsWithoutFolders(labels).forEach(({ ID = '' }) => {
        const count = elements.filter((element) => hasLabel(element, ID)).length;
        result[ID] =
            count === 0 ? LabelState.Off : count === elements.length ? LabelState.On : LabelState.Indeterminate;
    });
    return result;
};

interface Props {
    elements: Element[];
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

const LabelDropdown = ({ elements, onClose, onLock }: Props) => {
    const [uid] = useState(generateUID('label-dropdown'));
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const [labels = []] = useLabels() as [Label[], boolean, Error];
    const [search, updateSearch] = useState('');
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [selectedLabelIDs, updateSelectedLabelIDs] = useState<SelectionState>({});

    useEffect(() => {
        updateSelectedLabelIDs(getInitialState(labels, elements));
    }, [elements, labels.length]);

    if (!elements || !elements.length || !labels || !labels.length) {
        return null;
    }

    const typeIsMessage = isMessage(elements[0]);

    const normSearch = normalize(search);
    const list = getLabelsWithoutFolders(labels).filter(({ Name = '' }) => {
        if (!search) {
            return true;
        }
        const normName = normalize(Name);
        return normName.includes(normSearch);
    });

    const handleApply = async (selection = selectedLabelIDs) => {
        const labelAction = typeIsMessage ? labelMessages : labelConversations;
        const unlabelAction = typeIsMessage ? unlabelMessages : unlabelConversations;
        const selectedIDs = elements.map((element) => element.ID || '');

        // TODO to improve: we call label / unlabel too much
        const promises = Object.keys(selection).map((LabelID) => {
            if (selection[LabelID] === LabelState.On) {
                return api(labelAction({ LabelID, IDs: selectedIDs }));
            }
            if (selection[LabelID] === LabelState.Off) {
                return api(unlabelAction({ LabelID, IDs: selectedIDs }));
            }
        });
        await Promise.all(promises);
        await call();
        onClose();
        createNotification({ text: c('Success').t`Labels applied` });
    };

    const applyCheck = (labelIDs: string[], selected: boolean) => {
        const update = labelIDs.reduce((acc, ID) => {
            acc[ID] = selected ? LabelState.On : LabelState.Off;
            return acc;
        }, {} as SelectionState);

        updateSelectedLabelIDs({ ...selectedLabelIDs, ...update });
    };

    const handleCheck = (labelID: string) => ({ target, nativeEvent }: ChangeEvent<HTMLInputElement>) => {
        const { shiftKey } = nativeEvent as any;
        const labelIDs = [labelID];

        if (lastChecked && shiftKey) {
            const start = list.findIndex(({ ID }) => ID === labelID);
            const end = list.findIndex(({ ID }) => ID === lastChecked);
            labelIDs.push(...list.slice(Math.min(start, end), Math.max(start, end) + 1).map(({ ID = '' }) => ID));
        }

        setLastChecked(labelID);

        applyCheck(labelIDs, target.checked);
    };

    const handleAddNewLabel = (label?: Label) => {
        applyCheck([label?.ID || ''], true);
    };

    const handleCreate = () => {
        onLock(true);
        const newLabel = {
            Name: search,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Exclusive: false
        };
        createModal(
            <LabelModal type="label" label={newLabel} onAdd={handleAddNewLabel as any} onClose={() => onLock(false)} />
        );
    };

    return (
        <div className="p1">
            <div className="flex flex-spacebetween flex-items-center mb1">
                <label htmlFor="filter-labels" className="bold">{c('Label').t`Label as`}</label>
                <Tooltip title={c('Title').t`Create label`}>
                    <PrimaryButton className="pm-button--small pm-button--for-smallicon" onClick={handleCreate}>
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
                                    checked={selectedLabelIDs[ID] === LabelState.On}
                                    indeterminate={selectedLabelIDs[ID] === LabelState.Indeterminate}
                                    onChange={handleCheck(ID)}
                                />
                            </li>
                        );
                    })}
                    {list.length === 0 && (
                        <li
                            key="empty"
                            className="w100 flex flex-nowrap flex-spacebetween flex-items-center pt0-5 pb0-5"
                        >
                            {c('Info').t`No label found`}
                        </li>
                    )}
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
