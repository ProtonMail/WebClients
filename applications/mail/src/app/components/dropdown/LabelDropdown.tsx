import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Checkbox,
    Icon,
    LabelsUpsellModal,
    Mark,
    PrimaryButton,
    SearchInput,
    Tooltip,
    generateUID,
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
import { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';

import { getLabelIDs } from '../../helpers/elements';
import { getStandardFolders } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/useApplyLabels';
import { useCreateFilters } from '../../hooks/actions/useCreateFilters';
import { useMoveToFolder } from '../../hooks/actions/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { Element } from '../../models/element';
import { Breakpoints } from '../../models/utils';

import './LabelDropdown.scss';

export const labelDropdownContentProps = { className: 'flex flex-column flex-nowrap flex-align-items-stretch' };

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
    const applyLabels = useApplyLabels();
    const { moveToFolder, moveScheduledModal, moveAllModal, moveToSpamModal } = useMoveToFolder(setContainFocus);
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
        Color: getRandomAccentColor(),
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
            promises.push(moveToFolder(elements, MAILBOX_IDENTIFIERS.archive, folderName, labelID, false));
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
        <form
            className="flex flex-column flex-nowrap flex-justify-start flex-align-items-stretch flex-item-fluid-auto"
            onSubmit={handleSubmit}
        >
            <div className="flex flex-item-noshrink flex-justify-space-between flex-align-items-center m-4 mb-0">
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
            </div>
            <div className="flex-item-noshrink m-4 mb-0">
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
            <div
                className="label-dropdown-list overflow-auto mt-4 flex-item-fluid-auto"
                data-testid="label-dropdown-list"
            >
                <ul className="unstyled my-0">
                    {list.map(({ ID = '', Name = '', Color = '' }) => (
                        <li
                            key={ID}
                            className="dropdown-item dropdown-item-button relative cursor-pointer w100 flex flex-nowrap flex-align-items-center py-2 px-4"
                        >
                            <Checkbox
                                className="flex-item-noshrink mr-2"
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
                                    className="flex-item-noshrink relative mx-2"
                                />
                                <span className="text-ellipsis">
                                    <Mark value={search}>{Name}</Mark>
                                </span>
                            </label>
                        </li>
                    ))}
                    {list.length === 0 && !search && (
                        <li key="empty" className="dropdown-item w100 py-2 px-4">
                            {c('Info').t`No label found`}
                        </li>
                    )}
                    {list.length === 0 && search && (
                        <span className="flex w100">
                            <Button
                                key="create-new-label"
                                className="w100 mx-8 text-ellipsis"
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
            <hr className="m-0 flex-item-noshrink" />
            <div className={clsx(['px-4 mt-4 flex-item-noshrink', alwaysCheckboxDisabled && 'color-disabled'])}>
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
            <div className="px-4 mt-4 flex-item-noshrink">
                <Checkbox
                    id={archiveCheckID}
                    checked={alsoArchive}
                    onChange={({ target }) => updateAlsoArchive(target.checked)}
                    data-testid="label-dropdown:also-archive"
                    data-prevent-arrow-navigation
                >
                    {c('Label').t`Also archive`}
                </Checkbox>
            </div>
            <div className="m-4 flex-item-noshrink">
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
