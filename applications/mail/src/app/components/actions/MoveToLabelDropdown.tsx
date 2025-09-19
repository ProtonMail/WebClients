import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { Checkbox, EditLabelModal, Icon, LabelsUpsellModal, Mark, useModalState } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { useFolders, useLabels } from '@proton/mail';
import { isCustomLabel } from '@proton/mail/helpers/location';
import { getRandomAccentColor } from '@proton/shared/lib/colors';
import { LABEL_TYPE, MAILBOX_LABEL_IDS, MAIL_UPSELL_PATHS } from '@proton/shared/lib/constants';
import { hasReachedLabelLimit } from '@proton/shared/lib/helpers/folder';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';

import { getLabelIDs } from '../../helpers/elements';
import { getStandardFolders } from '../../helpers/labels';
import { useApplyLabels } from '../../hooks/actions/label/useApplyLabels';
import { useMoveToFolder } from '../../hooks/actions/move/useMoveToFolder';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElements';
import { useScrollToItem } from '../../hooks/useScrollToItem';
import type { Element } from '../../models/element';
import { folderLocation } from '../list/list-telemetry/listTelemetryHelper';
import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
import { MoveToDivider, MoveToDropdownButtons, MoveToPlaceholders } from './MoveToComponents';
import { MoveToSearchInput } from './MoveToSearchInput';

import './MoveToLabelDropdown.scss';

export const labelDropdownContentProps = { className: 'flex flex-column flex-nowrap items-stretch' };

enum LabelState {
    On = 'On',
    Off = 'Off',
    Indeterminate = 'Indeterminate',
}

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
                result[ID] = LabelState.On;
            } else {
                result[ID] = LabelState.Indeterminate;
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
                        acc[LabelState.Off] += 1;
                    } else if (elementLabels[ID]) {
                        acc[LabelState.On] += 1;
                    } else {
                        acc[LabelState.Indeterminate] += 1;
                    }
                    return acc;
                },
                { [LabelState.On]: 0, [LabelState.Off]: 0, [LabelState.Indeterminate]: 0 }
            );
            result[ID] =
                counts[LabelState.Off] === elements.length
                    ? LabelState.Off
                    : counts[LabelState.On] === elements.length
                      ? LabelState.On
                      : LabelState.Indeterminate;
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
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
}

export const MoveToLabelDropdown = ({ selectedIDs, labelID, onClose, onLock, selectAll, onCheckAll }: Props) => {
    const [uid] = useState(generateUID('label-dropdown'));
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const [search, setSearch] = useState('');
    const [containFocus, setContainFocus] = useState(true);
    const [lastChecked, setLastChecked] = useState(''); // Store ID of the last label ID checked
    const [alsoArchive, updateAlsoArchive] = useState(false);
    const [always, setAlways] = useState(false);
    const getElementsFromIDs = useGetElementsFromIDs();
    const { applyLabels, applyLabelsToAllModal } = useApplyLabels(setContainFocus);
    const { moveToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal } = useMoveToFolder(setContainFocus);
    const { applyMultipleLocations, applyLocation, applyOptimisticLocationEnabled } = useApplyLocation();

    const [editLabelProps, setEditLabelModalOpen, renderLabelModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const { scrollToItem, addRef } = useScrollToItem();

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

    useEffect(() => {
        onLock(!containFocus);
    }, [containFocus]);

    if (!selectedIDs || !selectedIDs.length) {
        return null;
    }

    const newLabel: Pick<Label, 'Name' | 'Color' | 'Type'> = {
        Name: search,
        Color: getRandomAccentColor(),
        Type: LABEL_TYPE.MESSAGE_LABEL,
    };

    // The dropdown is several times in the view, native html ids has to be different each time
    const archiveCheckID = `${uid}-archive`;
    const alwaysCheckID = `${uid}-always`;
    const labelCheckID = (ID: string) => `${uid}-${ID}`;

    const list = labels.filter(({ Name = '' }) => {
        if (!search) {
            return true;
        }
        return normalize(Name, true).includes(normalize(search, true));
    });

    const actualApplyLabels = async (changes: { [p: string]: boolean }) => {
        const elements = getElementsFromIDs(selectedIDs);
        const promises = [];

        if (applyOptimisticLocationEnabled) {
            promises.push(applyMultipleLocations({ elements, changes }));
        } else {
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
        }

        if (alsoArchive) {
            if (applyOptimisticLocationEnabled) {
                promises.push(
                    applyLocation({
                        elements,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        type: APPLY_LOCATION_TYPES.MOVE,
                    })
                );
            } else {
                const folderName = getStandardFolders()[MAILBOX_LABEL_IDS.ARCHIVE].name;
                promises.push(
                    moveToFolder({
                        elements,
                        sourceLabelID: labelID,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        folderName,
                        sourceAction: SOURCE_ACTION.LABEL_DROPDOWN,
                        currentFolder: folderLocation(labelID, labels, folders),
                    })
                );
            }
        }

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
        scrollToItem(label?.ID);
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

    const handleSearch = (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(changeEvent.target.value);
    };

    return (
        <form className="flex flex-column flex-nowrap justify-start items-stretch flex-auto" onSubmit={handleSubmit}>
            <div className="shrink-0 mt-6 mx-6">
                <MoveToSearchInput
                    title={c('Title').t`Label as`}
                    placeholder={c('Placeholder').t`Filter labels`}
                    value={search}
                    onChange={handleSearch}
                />
            </div>

            <div
                className="label-dropdown-list overflow-auto scrollbar-always-visible flex-auto"
                data-testid="label-dropdown-list"
            >
                {list.length === 0 ? (
                    <MoveToPlaceholders emptyListCopy={c('Info').t`No label found`} search={search} />
                ) : (
                    <ul className="unstyled my-0 mb-4">
                        {list.map((label, index) => (
                            <li
                                key={label.ID}
                                ref={(el) => addRef(label.ID, el)}
                                className={clsx(
                                    'dropdown-item dropdown-item-button cursor-pointer w-full flex flex-nowrap items-center py-2 px-6',
                                    index === 0 && 'mt-3'
                                )}
                            >
                                <Checkbox
                                    className="shrink-0 mr-4"
                                    id={labelCheckID(label.ID)}
                                    checked={selectedLabelIDs[label.ID] === LabelState.On}
                                    indeterminate={selectedLabelIDs[label.ID] === LabelState.Indeterminate}
                                    onChange={handleCheck(label.ID)}
                                    data-testid={`label-dropdown:label-checkbox-${label.Name}`}
                                />

                                {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
                                <label
                                    htmlFor={labelCheckID(label.ID)}
                                    title={label.Name}
                                    className="flex flex-nowrap items-center flex-1"
                                    data-testid={`label-dropdown:label-${label.Name}`}
                                    onClick={() => handleCheck(label.ID)}
                                >
                                    <Icon name="tag-filled" size={4} color={label.Color} className="shrink-0 mr-2" />
                                    <span className="text-ellipsis">
                                        <Mark value={search}>{label.Name}</Mark>
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <MoveToDivider />

            <div className="px-2">
                <Button
                    fullWidth
                    onClick={handleCreate}
                    shape="ghost"
                    className="text-left flex item-start my-2"
                    data-testid="move-to-create-label"
                    data-prevent-arrow-navigation
                >
                    <Icon name="plus" className="mr-2 mt-0.5" />
                    <span className="flex-1">{c('Action').t`Create label`}</span>
                </Button>
            </div>

            <MoveToDivider />
            <div className="px-4 mt-4 shrink-0">
                <Checkbox
                    id={alwaysCheckID}
                    checked={always}
                    onChange={({ target }) => setAlways(target.checked)}
                    data-testid="label-dropdown:always-move"
                    data-prevent-arrow-navigation
                >
                    {c('Label').t`Apply to future messages`}
                </Checkbox>
            </div>

            <div className="px-4 mt-4 shrink-0">
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
            <MoveToDropdownButtons
                loading={loading}
                disabled={getIsApplyDisabled(initialState, selectedLabelIDs, checkedIDs, always, alsoArchive)}
                onClose={() => onClose()}
                ctaText={c('Action').t`Apply`}
            />
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
