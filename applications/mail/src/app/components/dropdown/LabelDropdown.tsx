import React, { useState, ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';
import {
    SearchInput as UntypedSearchInput,
    Icon,
    Mark,
    useLabels,
    useModals,
    PrimaryButton,
    LabelModal,
    classnames,
    Tooltip,
    useLoading,
    Checkbox,
    generateUID
} from 'react-components';
import { normalize } from 'proton-shared/lib/helpers/string';
import { LABEL_COLORS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { Label } from 'proton-shared/lib/interfaces/Label';

import { Element } from '../../models/element';
import { hasLabel, isMessage as testIsMessage } from '../../helpers/elements';
import { useApplyLabels } from '../../hooks/useApplyLabels';

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
    labels.forEach(({ ID = '' }) => {
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
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const [labels = []] = useLabels();
    const [search, updateSearch] = useState('');
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [selectedLabelIDs, updateSelectedLabelIDs] = useState<SelectionState>({});
    const applyLabels = useApplyLabels();

    useEffect(() => {
        updateSelectedLabelIDs(getInitialState(labels, elements));
    }, [elements, labels.length]);

    if (!elements || !elements.length || !labels || !labels.length) {
        return null;
    }

    const normSearch = normalize(search);
    const list = labels.filter(({ Name = '' }) => {
        if (!search) {
            return true;
        }
        const normName = normalize(Name);
        return normName.includes(normSearch);
    });

    const handleApply = async (selection = selectedLabelIDs) => {
        const isMessage = testIsMessage(elements[0]);
        const elementIDs = elements.map((element) => element.ID || '');
        const initialState = getInitialState(labels, elements);
        const changes = Object.keys(selection).reduce((acc, LabelID) => {
            if (selection[LabelID] === LabelState.On && initialState[LabelID] !== LabelState.On) {
                acc[LabelID] = true;
            }
            if (selection[LabelID] === LabelState.Off && initialState[LabelID] !== LabelState.Off) {
                acc[LabelID] = false;
            }
            return acc;
        }, {} as { [labelID: string]: boolean });
        await applyLabels(isMessage, elementIDs, changes);
        onClose();
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
        <div>
            <div className="flex flex-spacebetween flex-items-center m1">
                <label htmlFor="filter-labels" className="bold">{c('Label').t`Label as`}</label>
                <Tooltip title={c('Title').t`Create label`}>
                    <PrimaryButton className="pm-button--small pm-button--for-smallicon" onClick={handleCreate}>
                        <Icon name="label" className="flex-item-noshrink mr0-25" />+
                    </PrimaryButton>
                </Tooltip>
            </div>
            <div className="m1">
                <SearchInput
                    autoFocus={true}
                    value={search}
                    onChange={updateSearch}
                    id="filter-labels"
                    placeholder={c('Placeholder').t`Filter labels`}
                />
            </div>
            <div className="scroll-if-needed customScrollBar-container scroll-smooth-touch mb1 labelDropdown-list-container">
                <ul className="unstyled mt0 mb0">
                    {list.map(({ ID = '', Name = '', Color = '' }, index) => {
                        // The dropdown is several times in the view, native html ids has to be different each time
                        const lineId = `${uid}-${ID}`;
                        return (
                            <li
                                key={lineId}
                                className={classnames([
                                    'w100 flex flex-nowrap flex-spacebetween flex-items-center pt0-5 pb0-5 pl1',
                                    index < list.length - 1 && 'border-bottom'
                                ])}
                            >
                                <div className="flex flex-nowrap flex-spacebetween flex-items-center">
                                    <Icon name="label" color={Color} className="flex-item-noshrink mr0-5" />
                                    <label htmlFor={lineId} title={Name} className="ellipsis">
                                        <Mark value={search}>{Name}</Mark>
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
                            className="w100 flex flex-nowrap flex-spacebetween flex-items-center pt0-5 pb0-5 pl1 pr1 border-top border-bottom"
                        >
                            {c('Info').t`No label found`}
                        </li>
                    )}
                </ul>
            </div>
            <div className="mt1 mb1 ml1 mr0-75 flex flex-spacebetween">
                <label htmlFor="alsoArchive">{c('Label').t`Also archive`}</label>
                <Checkbox
                    id="alsoArchive"
                    checked={alsoArchive}
                    onChange={({ target }) => updateAlsoArchive(target.checked)}
                />
            </div>
            <div className="p1">
                <PrimaryButton className="w100" loading={loading} onClick={() => withLoading(handleApply())}>
                    {c('Action').t`Apply`}
                </PrimaryButton>
            </div>
        </div>
    );
};

export default LabelDropdown;
