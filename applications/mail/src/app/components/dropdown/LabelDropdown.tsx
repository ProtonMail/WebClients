import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import {
    Button,
    Checkbox,
    FeatureCode,
    Icon,
    Mark,
    PrimaryButton,
    SearchInput,
    Tooltip,
    classnames,
    generateUID,
    useFeature,
    useLabels,
    useLoading,
    useModalState,
} from '@proton/components';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { ACCENT_COLORS, LABEL_TYPE, MAILBOX_IDENTIFIERS } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { normalize } from '@proton/shared/lib/helpers/string';
import { Label } from '@proton/shared/lib/interfaces/Label';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { getLabelIDs } from '../../helpers/elements';
import { getStandardFolders } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/useApplyLabels';
import { useCreateFilters } from '../../hooks/actions/useCreateFilters';
import { useMoveToFolder } from '../../hooks/actions/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';

import './LabelDropdown.scss';

enum LabelState {
    On = 'On',
    Off = 'Off',
    Indeterminate = 'Indeterminate',
}
const { On, Off, Indeterminate } = LabelState;

type SelectionState = { [labelID: string]: LabelState };

const getInitialState = (labels: Label[] = [], elements: Element[] = []) => {
    const result: SelectionState = {};
    const elementsLabels = elements.map((element) =>
        getLabelIDs(
            element,
            // Undefined and not labelID here. Because applying a label to a conversation apply to all messages
            // Not only those from the current labelID.
            undefined
        )
    );
    labels.forEach(({ ID = '' }) => {
        const counts = elementsLabels.reduce<{ [state: string]: number }>(
            (acc, elementLabels) => {
                if (elementLabels[ID] === undefined) {
                    acc[Off] += 1;
                } else if (elementLabels[ID]) {
                    acc[On] += 1;
                } else {
                    acc[Indeterminate] += 1;
                }
                return acc;
            },
            { [On]: 0, [Off]: 0, [Indeterminate]: 0 }
        );
        result[ID] = counts[Off] === elements.length ? Off : counts[On] === elements.length ? On : Indeterminate;
    });
    return result;
};

const getIsApplyDisabled = (
    initialState: SelectionState,
    selectedLabelIDs: SelectionState,
    checkedIDs: string[],
    always: boolean,
    alsoArchive: boolean
) => {
    // If same labels, no changes have been made in the label dropdown
    const areSameLabels = isDeepEqual(initialState, selectedLabelIDs);

    // If some labels are checked
    // If there are no changes in the dropdown AND always label OR also archive are checked => We should be able to apply, so we return false
    // Else, no changes are detected AND we have no action to do => Apply should be disabled
    if (checkedIDs.length > 0) {
        return areSameLabels && !(always || alsoArchive);
    }
    // If no labels are checked
    // If no changes in the dropdown AND also archive is checked => We should be able to apply, so we return false
    // Else, no changes are detected and no action to do => Apply should be disabled
    return areSameLabels && !alsoArchive;
};

interface Props {
    selectedIDs: string[];
    labelID: string;
    onClose: () => void;
    onLock: (lock: boolean) => void;
    breakpoints: Breakpoints;
}

const LabelDropdown = ({ selectedIDs, labelID, onClose, onLock, breakpoints }: Props) => {
    const [labels = []] = useLabels();

    const labelIDs = labels.map(({ ID }) => ID);
    const contextFilteringFeature = useFeature(FeatureCode.ContextFiltering);
    const displayContextFiltering =
        contextFilteringFeature.feature?.Value === true && contextFilteringFeature.loading === false;

    const [uid] = useState(generateUID('label-dropdown'));
    const [loading, withLoading] = useLoading();
    const [search, updateSearch] = useState('');
    const [containFocus, setContainFocus] = useState(true);
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [always, setAlways] = useState(false);
    const getElementsFromIDs = useGetElementsFromIDs();
    const applyLabels = useApplyLabels();
    const { moveToFolder, moveScheduledModal, moveAllModal, moveToSpamModal } = useMoveToFolder(setContainFocus);
    const { getSendersToFilter } = useCreateFilters();

    const [editLabelProps, setEditLabelModalOpen] = useModalState();

    const initialState = useMemo(
        () => getInitialState(labels, getElementsFromIDs(selectedIDs)),
        [selectedIDs, labels, labelID]
    );

    const [selectedLabelIDs, setSelectedLabelIDs] = useState<SelectionState>(initialState);

    // IDs currently checked in the modal
    // We will use this string[] to always label sender's emails on all checked ids in the modal
    const checkedIDs = useMemo(() => {
        return Object.keys(selectedLabelIDs).reduce<string[]>((acc, LabelID) => {
            if (selectedLabelIDs[LabelID] === LabelState.On) {
                acc.push(LabelID);
            }
            return acc;
        }, []);
    }, [selectedLabelIDs]);

    const changes = useMemo(() => {
        const elements = getElementsFromIDs(selectedIDs);
        const initialState = getInitialState(labels, elements);
        return Object.keys(selectedLabelIDs).reduce((acc, LabelID) => {
            if (selectedLabelIDs[LabelID] === LabelState.On && initialState[LabelID] !== LabelState.On) {
                acc[LabelID] = true;
            }
            if (selectedLabelIDs[LabelID] === LabelState.Off && initialState[LabelID] !== LabelState.Off) {
                acc[LabelID] = false;
            }
            return acc;
        }, {} as { [labelID: string]: boolean });
    }, [selectedIDs, initialState, selectedLabelIDs]);

    // Always checkbox should be disabled when we don't find senders OR there are no labels checked (so no filter based on labels to create)
    const alwaysCheckboxDisabled = useMemo(() => {
        return !getSendersToFilter(getElementsFromIDs(selectedIDs)).length || checkedIDs.length < 1;
    }, [getSendersToFilter, selectedIDs, changes]);

    useEffect(() => {
        if (alwaysCheckboxDisabled && always) {
            setAlways(false);
        }
    }, [alwaysCheckboxDisabled, always]);

    useEffect(() => onLock(!containFocus), [containFocus]);

    if (!selectedIDs || !selectedIDs.length) {
        return null;
    }

    const newLabel: Pick<Label, 'Name' | 'Color' | 'Type'> = {
        Name: search,
        Color: ACCENT_COLORS[randomIntFromInterval(0, ACCENT_COLORS.length - 1)],
        Type: LABEL_TYPE.MESSAGE_LABEL,
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const searchInputID = `${uid}-search`;
    const archiveCheckID = `${uid}-archive`;
    const alwaysCheckID = `${uid}-always`;
    const labelCheckID = (ID: string) => `${uid}-${ID}`;
    const applyDisabled = getIsApplyDisabled(initialState, selectedLabelIDs, checkedIDs, always, alsoArchive);
    const autoFocusSearch = !breakpoints.isNarrow;
    const normSearch = normalize(search, true);
    const list = labels.filter(({ Name = '' }) => {
        if (!search) {
            return true;
        }
        const normName = normalize(Name, true);
        return normName.includes(normSearch);
    });

    const actualApplyLabels = async (changes: { [p: string]: boolean }) => {
        const elements = getElementsFromIDs(selectedIDs);

        const promises = [];

        promises.push(applyLabels(elements, changes, always, false, checkedIDs));

        if (alsoArchive) {
            const folderName = getStandardFolders()[MAILBOX_IDENTIFIERS.archive].name;
            const fromLabelID = labelIDs.includes(labelID) ? MAILBOX_IDENTIFIERS.inbox : labelID;
            promises.push(moveToFolder(elements, MAILBOX_IDENTIFIERS.archive, folderName, fromLabelID, false));
        }

        await Promise.all(promises);
        onClose();
    };

    const handleApply = async () => {
        await actualApplyLabels(changes);
    };

    const applyCheck = (labelIDs: string[], selected: boolean) => {
        const update = labelIDs.reduce((acc, ID) => {
            acc[ID] = selected ? LabelState.On : LabelState.Off;
            return acc;
        }, {} as SelectionState);

        setSelectedLabelIDs({ ...selectedLabelIDs, ...update });
    };

    const handleCheck =
        (labelID: string) =>
        ({ target, nativeEvent }: ChangeEvent<HTMLInputElement>) => {
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
        setEditLabelModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await withLoading(handleApply());
    };

    const handleApplyDirectly = async (labelID: string) => {
        const updatedChanges = {
            ...changes,
            [labelID]: selectedLabelIDs[labelID] !== LabelState.On,
        };

        await actualApplyLabels(updatedChanges);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-justify-space-between flex-align-items-center m1 mb0">
                <span className="text-bold" tabIndex={-2}>
                    {c('Label').t`Label as`}
                </span>
                <Tooltip title={c('Title').t`Create label`}>
                    <Button
                        icon
                        color="norm"
                        size="small"
                        onClick={handleCreate}
                        className="flex flex-align-items-center"
                        data-testid="label-dropdown:add-label"
                        data-prevent-arrow-navigation
                    >
                        <Icon name="tag" /> +
                    </Button>
                </Tooltip>
                <EditLabelModal
                    label={newLabel}
                    onAdd={(label) => handleAddNewLabel(label)}
                    onCloseCustomAction={() => setContainFocus(true)}
                    {...editLabelProps}
                />
            </div>
            <div className="m1 mb0">
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter labels`}
                    autoFocus={autoFocusSearch}
                    data-test-selector="label-dropdown:search-label"
                    data-prevent-arrow-navigation
                />
            </div>
            <div
                className="scroll-if-needed scroll-smooth-touch mt1 label-dropdown-list-container"
                data-testid="label-dropdown-list"
            >
                <ul className="unstyled mt0 mb0">
                    {list.map(({ ID = '', Name = '', Color = '' }) => (
                        <li
                            key={ID}
                            className="dropdown-item dropdown-item-button relative cursor-pointer w100 flex flex-nowrap flex-align-items-center pt0-5 pb0-5 pl1 pr1"
                        >
                            <Checkbox
                                className="flex-item-noshrink mrO-5"
                                id={labelCheckID(ID)}
                                checked={selectedLabelIDs[ID] === LabelState.On}
                                indeterminate={selectedLabelIDs[ID] === LabelState.Indeterminate}
                                onChange={handleCheck(ID)}
                                data-testid={`label-dropdown:label-checkbox-${Name}`}
                            />
                            <label
                                htmlFor={labelCheckID(ID)}
                                title={Name}
                                className="flex flex-nowrap flex-align-items-center flex-item-fluid"
                                data-testid={`label-dropdown:label-${Name}`}
                                onClick={() => handleApplyDirectly(ID)}
                            >
                                <Icon
                                    name="circle-filled"
                                    size={16}
                                    color={Color}
                                    className="flex-item-noshrink relative ml0-5 mr0-5"
                                />
                                <span className="text-ellipsis">
                                    <Mark value={search}>{Name}</Mark>
                                </span>
                            </label>
                        </li>
                    ))}
                    {list.length === 0 && (
                        <li key="empty" className="dropdown-item w100 pt0-5 pb0-5 pl1 pr1">
                            {c('Info').t`No label found`}
                        </li>
                    )}
                </ul>
            </div>
            {displayContextFiltering && (
                <div className={classnames(['p1 border-top', alwaysCheckboxDisabled && 'color-disabled'])}>
                    <Checkbox
                        className="mr0-5"
                        id={alwaysCheckID}
                        checked={always}
                        disabled={alwaysCheckboxDisabled}
                        onChange={({ target }) => setAlways(target.checked)}
                        data-testid="label-dropdown:always-move"
                        data-prevent-arrow-navigation
                    />
                    <label htmlFor={alwaysCheckID} className="flex-item-fluid">
                        {c('Label').t`Always label sender's emails`}
                    </label>
                </div>
            )}
            <div className={classnames([!displayContextFiltering && 'py1 border-top', 'flex ml1 mr1'])}>
                <Checkbox
                    className="mr0-5"
                    id={archiveCheckID}
                    checked={alsoArchive}
                    onChange={({ target }) => updateAlsoArchive(target.checked)}
                    data-testid="label-dropdown:also-archive"
                    data-prevent-arrow-navigation
                />
                <label htmlFor={archiveCheckID} className="flex-item-fluid">
                    {c('Label').t`Also archive`}
                </label>
            </div>
            <div className="m1">
                <PrimaryButton
                    className="w100"
                    loading={loading}
                    disabled={applyDisabled}
                    data-testid="label-dropdown:apply"
                    data-prevent-arrow-navigation
                    type="submit"
                >
                    {c('Action').t`Apply`}
                </PrimaryButton>
            </div>
            {moveScheduledModal}
            {moveAllModal}
            {moveToSpamModal}
        </form>
    );
};

export default LabelDropdown;
