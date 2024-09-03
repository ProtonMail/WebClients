import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { Breakpoints } from '@proton/components';
import {
    Checkbox,
    Icon,
    LabelsUpsellModal,
    Mark,
    PrimaryButton,
    SearchInput,
    Tooltip,
    useLabels,
    useModalState,
    useUser,
} from '@proton/components';
import EditLabelModal from '@proton/components/containers/labels/modals/EditLabelModal';
import { useLoading } from '@proton/hooks';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_IDENTIFIERS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { getLabelIDs } from '../../helpers/elements';
import { getStandardFolders, isCustomLabel } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/label/useApplyLabels';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useCreateFilters } from '../../hooks/actions/useCreateFilters';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import type { Element } from '../../models/element';

import './LabelDropdown.scss';

export const labelDropdownContentProps = { className: 'flex flex-column flex-nowrap items-stretch' };

enum LabelState {
    On = 'On',
    Off = 'Off',
    Indeterminate = 'Indeterminate',
}
const { On, Off, Indeterminate } = LabelState;

type SelectionState = { [labelID: string]: LabelState };

export const getInitialState = (labels: Label[] = [], elements: Element[] = [], labelID: string, selectAll = false) => {
    const result: SelectionState = {};

    // If the user is applying the labels using a select all, we have no way to determine the proper labels state in the dropdown.
    // We only know the elements in the current page.
    // Because of that, in the select all case, we want to leave all checkboxes "indeterminate" in the label dropdown
    if (selectAll) {
        // However, if the user is inside a custom label, then we know that all location's elements are inside this label
        // So we let the user the possibility to unlabel all elements, meaning that we need to check the checkbox in that case only
        const isInsideCustomLabel = isCustomLabel(labelID, labels);

        labels.forEach(({ ID = '' }) => {
            if (isInsideCustomLabel && ID === labelID) {
                result[ID] = On;
            } else {
                result[ID] = Indeterminate;
            }
        });
    } else {
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
    }

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
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}

const LabelDropdown = ({ selectedIDs, labelID, onClose, onLock, breakpoints, selectAll, onCheckAll }: Props) => {
    const [uid] = useState(generateUID('label-dropdown'));
    const [labels = []] = useLabels();
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const [search, updateSearch] = useState('');
    const [containFocus, setContainFocus] = useState(true);
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [always, setAlways] = useState(false);
    const getElementsFromIDs = useGetElementsFromIDs();
    const { applyLabels, applyLabelsToAllModal } = useApplyLabels(setContainFocus);
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal } = useMoveToFolder(setContainFocus);
    const { getSendersToFilter } = useCreateFilters();

    /*
     * translator: Text displayed in a button to suggest the creation of a new label in the label dropdown
     * This button is shown when the user search for a label which doesn't exist
     * ${search} is a string containing the search the user made in the label dropdown
     * Full sentence for reference: 'Create label "Dunder Mifflin"'
     */
    const createLabelButtonText = c('Title').t`Create label "${search}"`;

    const [editLabelProps, setEditLabelModalOpen, renderLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const initialState = useMemo(
        () => getInitialState(labels, getElementsFromIDs(selectedIDs), labelID, selectAll),
        [selectedIDs, labels, labelID, selectAll]
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
        const initialState = getInitialState(labels, elements, labelID, selectAll);
        return Object.keys(selectedLabelIDs).reduce(
            (acc, LabelID) => {
                if (selectedLabelIDs[LabelID] === LabelState.On && initialState[LabelID] !== LabelState.On) {
                    acc[LabelID] = true;
                }
                if (selectedLabelIDs[LabelID] === LabelState.Off && initialState[LabelID] !== LabelState.Off) {
                    acc[LabelID] = false;
                }
                return acc;
            },
            {} as { [labelID: string]: boolean }
        );
    }, [selectedIDs, initialState, selectedLabelIDs, selectAll, labels]);

    // Always checkbox should be disabled when we don't find senders OR there are no labels checked (so no filter based on labels to create)
    const alwaysCheckboxDisabled = useMemo(() => {
        return !getSendersToFilter(getElementsFromIDs(selectedIDs)).length || checkedIDs.length < 1 || !!selectAll;
    }, [getSendersToFilter, selectedIDs, changes, selectAll]);

    const archiveCheckboxDisabled = !!selectAll;

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
        Color: getRandomAccentColor(),
        Type: LABEL_TYPE.MESSAGE_LABEL,
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const searchInputID = `${uid}-search`;
    const archiveCheckID = `${uid}-archive`;
    const alwaysCheckID = `${uid}-always`;
    const labelCheckID = (ID: string) => `${uid}-${ID}`;
    const applyDisabled = getIsApplyDisabled(initialState, selectedLabelIDs, checkedIDs, always, alsoArchive);
    const autoFocusSearch = !breakpoints.viewportWidth['<=small'];
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

        promises.push(
            applyLabels({
                elements,
                changes,
                createFilters: always,
                selectedLabelIDs: checkedIDs,
                labelID,
                selectAll,
                onCheckAll,
            })
        );

        if (alsoArchive) {
            const folderName = getStandardFolders()[MAILBOX_IDENTIFIERS.archive].name;
            promises.push(
                moveToFolder({
                    elements,
                    sourceLabelID: labelID,
                    destinationLabelID: MAILBOX_IDENTIFIERS.archive,
                    folderName,
                })
            );
        }

        await Promise.all(promises);
        onClose();
    };

    const handleApply = async () => {
        await actualApplyLabels(changes);
    };

    const applyCheck = (labelIDs: string[], selected: boolean) => {
        const update = labelIDs.reduce((acc, ID) => {
            /*
             * With select all, we don't know which labels are applied or not on all location elements since we only know the current page.
             * => Users should be able to add labels only. (Case 1)
             * It means that in the Dropdown, the user should not be able to have a checkbox "off" state (which would cause a unlabel).
             * State should be "Indeterminate" by default, and when clicking on a label twice
             * (passing the checkbox ON and clicking again) should also lead to an "Indeterminate" state. (Case 3)
             *
             * However, if we're inside a custom label, we do know that this label is applied on all elements,
             * and it should be possible to unlabel it if the user wants to. In that case we can pass the checkbox to "off" (Case 2)
             */
            if (selectAll) {
                const isInsideCustomLabel = isCustomLabel(labelID, labels);
                const canUnlabel = isInsideCustomLabel && ID === labelID;

                if (selected) {
                    // Case 1
                    acc[ID] = LabelState.On;
                } else if (canUnlabel) {
                    // Case 2
                    acc[ID] = LabelState.Off;
                } else {
                    // Case 3
                    acc[ID] = LabelState.Indeterminate;
                }
            } else {
                acc[ID] = selected ? LabelState.On : LabelState.Off;
            }
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
        // Set focus state to lock the dropdown
        // We need this otherwise modal that is rendered in the dropdown will be closed if dropdown disappear from the DOM
        setContainFocus(false);

        if (hasReachedLabelLimit(user, labels)) {
            handleUpsellModalDisplay(true);
        } else {
            setEditLabelModalOpen(true);
        }
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
        <form className="flex flex-column flex-nowrap justify-start items-stretch flex-auto" onSubmit={handleSubmit}>
            <div className="flex shrink-0 justify-space-between items-center m-4 mb-0">
                <span className="text-bold" tabIndex={-2}>
                    {c('Label').t`Label as`}
                </span>
                <Tooltip title={c('Title').t`Create label`}>
                    <Button
                        icon
                        color="norm"
                        size="small"
                        onClick={handleCreate}
                        className="flex items-center"
                        data-testid="label-dropdown:add-label"
                        data-prevent-arrow-navigation
                    >
                        <Icon name="tag" /> +
                    </Button>
                </Tooltip>
            </div>
            <div className="shrink-0 m-4 mb-0">
                <SearchInput
                    value={search}
                    onChange={updateSearch}
                    id={searchInputID}
                    placeholder={c('Placeholder').t`Filter labels`}
                    autoFocus={autoFocusSearch}
                    data-test-selector="label-dropdown:search-label"
                    data-prevent-arrow-navigation
                    data-testid="label-dropdown:search-input"
                />
            </div>
            <div className="label-dropdown-list overflow-auto mt-4 flex-auto" data-testid="label-dropdown-list">
                <ul className="unstyled my-0">
                    {list.map(({ ID = '', Name = '', Color = '' }) => (
                        <li
                            key={ID}
                            className="dropdown-item dropdown-item-button relative cursor-pointer w-full flex flex-nowrap items-center py-2 px-4"
                        >
                            <Checkbox
                                className="shrink-0 mr-2"
                                id={labelCheckID(ID)}
                                checked={selectedLabelIDs[ID] === LabelState.On}
                                indeterminate={selectedLabelIDs[ID] === LabelState.Indeterminate}
                                onChange={handleCheck(ID)}
                                data-testid={`label-dropdown:label-checkbox-${Name}`}
                            />
                            <label
                                htmlFor={labelCheckID(ID)}
                                title={Name}
                                className="flex flex-nowrap items-center flex-1"
                                data-testid={`label-dropdown:label-${Name}`}
                                onClick={() => handleApplyDirectly(ID)}
                            >
                                <Icon name="circle-filled" size={4} color={Color} className="shrink-0 relative mx-2" />
                                <span className="text-ellipsis">
                                    <Mark value={search}>{Name}</Mark>
                                </span>
                            </label>
                        </li>
                    ))}
                    {list.length === 0 && !search && (
                        <li key="empty" className="dropdown-item w-full py-2 px-4">
                            {c('Info').t`No label found`}
                        </li>
                    )}
                    {list.length === 0 && search && (
                        <span className="flex w-full">
                            <Button
                                key="create-new-label"
                                className="w-full mx-8 text-ellipsis"
                                data-testid="label-dropdown:create-label-option"
                                title={createLabelButtonText}
                                onClick={handleCreate}
                            >
                                {createLabelButtonText}
                            </Button>
                        </span>
                    )}
                </ul>
            </div>
            <hr className="m-0 shrink-0" />
            <div className={clsx(['px-4 mt-4 shrink-0', alwaysCheckboxDisabled && 'color-disabled'])}>
                <Checkbox
                    id={alwaysCheckID}
                    checked={always}
                    disabled={alwaysCheckboxDisabled}
                    onChange={({ target }) => setAlways(target.checked)}
                    data-testid="label-dropdown:always-move"
                    data-prevent-arrow-navigation
                >
                    {c('Label').t`Always label sender's emails`}
                </Checkbox>
            </div>
            <div className={clsx(['px-4 mt-4 shrink-0', archiveCheckboxDisabled && 'color-disabled'])}>
                <Checkbox
                    id={archiveCheckID}
                    checked={alsoArchive}
                    disabled={archiveCheckboxDisabled}
                    onChange={({ target }) => updateAlsoArchive(target.checked)}
                    data-testid="label-dropdown:also-archive"
                    data-prevent-arrow-navigation
                >
                    {c('Label').t`Also archive`}
                </Checkbox>
            </div>
            <div className="m-4 shrink-0">
                <PrimaryButton
                    className="w-full"
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
            {moveSnoozedModal}
            {moveToSpamModal}
            {applyLabelsToAllModal}
            {renderLabelModal && (
                <EditLabelModal
                    label={newLabel}
                    onAdd={(label) => handleAddNewLabel(label)}
                    onCloseCustomAction={() => setContainFocus(true)}
                    {...editLabelProps}
                />
            )}
            {renderUpsellModal && (
                <LabelsUpsellModal
                    modalProps={upsellModalProps}
                    feature={MAIL_UPSELL_PATHS.UNLIMITED_LABELS}
                    onCloseCustomAction={() => {
                        setContainFocus(true);
                        onClose();
                    }}
                />
            )}
        </form>
    );
};

export default LabelDropdown;
