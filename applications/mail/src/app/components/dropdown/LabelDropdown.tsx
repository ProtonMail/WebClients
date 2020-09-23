import React, { useState, ChangeEvent, useMemo, useEffect } from 'react';
import { c } from 'ttag';
import { FocusScope } from '@react-aria/focus';
import {
    SearchInput,
    Icon,
    Mark,
    useModals,
    PrimaryButton,
    LabelModal,
    Tooltip,
    useLoading,
    Checkbox,
    generateUID
} from 'react-components';
import { normalize } from 'proton-shared/lib/helpers/string';
import { LABEL_COLORS, LABEL_TYPE, MAILBOX_IDENTIFIERS } from 'proton-shared/lib/constants';
import { randomIntFromInterval } from 'proton-shared/lib/helpers/function';
import { Label } from 'proton-shared/lib/interfaces/Label';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';

import { Element } from '../../models/element';
import { hasLabel } from '../../helpers/elements';
import { useApplyLabels, useMoveToFolder } from '../../hooks/useApplyLabels';
import { getStandardFolders } from '../../helpers/labels';
import { Breakpoints } from '../../models/utils';

import './LabelDropdown.scss';

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
    labels?: Label[];
    labelID: string;
    onClose: () => void;
    onLock: (lock: boolean) => void;
    breakpoints: Breakpoints;
}

const LabelDropdown = ({ elements, labelID, labels = [], onClose, onLock, breakpoints }: Props) => {
    const labelIDs = labels.map(({ ID }) => ID);
    const [uid] = useState(generateUID('label-dropdown'));
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const [search, updateSearch] = useState('');
    const [containFocus, setContainFocus] = useState(true);
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);

    const applyLabels = useApplyLabels();
    const moveToFolder = useMoveToFolder();

    const initialState = useMemo(() => getInitialState(labels, elements), [elements, labels]);
    const [selectedLabelIDs, setSelectedLabelIDs] = useState<SelectionState>(initialState);

    useEffect(() => onLock(!containFocus), [containFocus]);

    if (!elements || !elements.length) {
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
        const promises = [applyLabels(elements, changes)];
        if (alsoArchive) {
            const folderName = getStandardFolders()[MAILBOX_IDENTIFIERS.archive].name;
            const fromLabelID = labelIDs.includes(labelID) ? MAILBOX_IDENTIFIERS.inbox : labelID;
            promises.push(moveToFolder(elements, MAILBOX_IDENTIFIERS.archive, folderName, fromLabelID));
        }
        await Promise.all(promises);
        onClose();
    };

    const handleClickIcon = (labelID: string) => () => handleApply({ [labelID]: LabelState.On });

    const applyCheck = (labelIDs: string[], selected: boolean) => {
        const update = labelIDs.reduce((acc, ID) => {
            acc[ID] = selected ? LabelState.On : LabelState.Off;
            return acc;
        }, {} as SelectionState);

        setSelectedLabelIDs({ ...selectedLabelIDs, ...update });
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

    const handleAddNewLabel = (label?: Partial<Label>) => {
        applyCheck([label?.ID || ''], true);
    };

    const handleCreate = () => {
        setContainFocus(false);
        const newLabel: Pick<Label, 'Name' | 'Color' | 'Type'> = {
            Name: search,
            Color: LABEL_COLORS[randomIntFromInterval(0, LABEL_COLORS.length - 1)],
            Type: LABEL_TYPE.MESSAGE_LABEL
        };
        createModal(
            <LabelModal
                label={newLabel}
                onAdd={(label) => handleAddNewLabel(label)}
                onClose={() => setContainFocus(false)}
            />
        );
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const searchInputID = `${uid}-search`;
    const archiveCheckID = `${uid}-archive`;
    const labelCheckID = (ID: string) => `${uid}-${ID}`;
    const applyDisabled = isDeepEqual(initialState, selectedLabelIDs);
    const autoFocusSearch = !breakpoints.isNarrow;

    return (
        <FocusScope contain={containFocus} restoreFocus autoFocus>
            <div className="flex flex-spacebetween flex-items-center m1 mb0">
                <span className="bold" tabIndex={-2}>
                    {c('Label').t`Label as`}
                </span>
                <Tooltip title={c('Title').t`Create label`}>
                    <PrimaryButton className="pm-button--small pm-button--for-smallicon" onClick={handleCreate}>
                        <Icon name="label" className="flex-item-noshrink mr0-25" />+
                    </PrimaryButton>
                </Tooltip>
            </div>
            <div className="m1 mb0">
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter labels`}
                    autoFocus={autoFocusSearch}
                />
            </div>
            <div className="scroll-if-needed scroll-smooth-touch mt1 labelDropdown-list-container">
                <ul className="unstyled mt0 mb0">
                    {list.map(({ ID = '', Name = '', Color = '' }) => (
                        <li
                            key={ID}
                            className="dropDown-item dropDown-item-button relative cursor-pointer w100 flex flex-nowrap flex-items-center pt0-5 pb0-5 pl1 pr1"
                        >
                            <label
                                htmlFor={labelCheckID(ID)}
                                title={Name}
                                className="flex flex-nowrap flex-items-center increase-surface-click flex-item-fluid"
                            >
                                <Icon
                                    name="circle"
                                    size={12}
                                    color={Color}
                                    className="flex-item-noshrink relative ml0-25 mr0-5"
                                    onClick={handleClickIcon(ID)}
                                />
                                <span className="ellipsis">
                                    <Mark value={search}>{Name}</Mark>
                                </span>
                            </label>
                            <Checkbox
                                className="flex-item-noshrink"
                                id={labelCheckID(ID)}
                                checked={selectedLabelIDs[ID] === LabelState.On}
                                indeterminate={selectedLabelIDs[ID] === LabelState.Indeterminate}
                                onChange={handleCheck(ID)}
                            />
                        </li>
                    ))}
                    {list.length === 0 && (
                        <li key="empty" className="dropDown-item w100 pt0-5 pb0-5 pl1 pr1">
                            {c('Info').t`No label found`}
                        </li>
                    )}
                </ul>
            </div>
            <div className="flex m1 mb0">
                <Checkbox
                    id={archiveCheckID}
                    checked={alsoArchive}
                    onChange={({ target }) => updateAlsoArchive(target.checked)}
                />
                <label htmlFor={archiveCheckID} className="flex-item-fluid">
                    {c('Label').t`Also archive`}
                </label>
            </div>
            <div className="m1">
                <PrimaryButton
                    className="w100"
                    loading={loading}
                    onClick={() => withLoading(handleApply())}
                    disabled={applyDisabled}
                >
                    {c('Action').t`Apply`}
                </PrimaryButton>
            </div>
        </FocusScope>
    );
};

export default LabelDropdown;
