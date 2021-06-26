import React, { useState, useMemo, FormEvent, useEffect } from 'react';
import { c } from 'ttag';

import { normalize } from '@proton/shared/lib/helpers/string';
import { noop } from '@proton/shared/lib/helpers/function';
import { addTreeFilter, updateFilter } from '@proton/shared/lib/api/filters';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { FormModal, ConfirmModal, Alert, Loader, Button } from '../../../components';
import {
    useLoading,
    useLabels,
    useFolders,
    useActiveBreakpoint,
    useNotifications,
    useFilters,
    useEventManager,
    useApiWithoutResult,
    useModals,
} from '../../../hooks';

import HeaderFilterModal from './HeaderFilterModal';
import FooterFilterModal from './FooterFilterModal';
import FilterNameForm from './FilterNameForm';
import FilterActionsForm from './FilterActionsForm';
import FilterConditionsForm from './FilterConditionsForm';
import FilterPreview from './FilterPreview';

import {
    SimpleFilterModalModel,
    Filter,
    Step,
    Errors,
    Condition,
    Actions,
    FilterStatement,
    FilterOperator,
    FilterActions,
    FilterCondition,
} from '../interfaces';
import { computeFromTree, convertModel } from '../utils';

import { generateUID } from '../../../helpers';
import { getDefaultFolders } from '../constants';

interface Props {
    filter?: Filter;
    onClose?: () => void;
}

const checkNameErrors = (filters: Filter[], name: string): string => {
    if (!name) {
        return c('Error').t`This field is required`;
    }
    if (filters.find(({ Name }: Filter) => normalize(Name) === normalize(name))) {
        return c('Error').t`Filter with this name already exists`;
    }
    return '';
};

const checkConditionsErrors = (conditions: Condition[]): string => {
    if (conditions.some((c) => !!c.error)) {
        return c('Error').t`Error in one of the conditions`;
    }
    if (!conditions.length) {
        return c('Error').t`Require at least one condition`;
    }
    return '';
};

const checkActionsErrors = (actions: Actions) => {
    const { labelAs, markAs, moveTo, autoReply } = actions;

    if (!labelAs.labels.length && !moveTo.folder && !markAs.read && !markAs.starred && !autoReply) {
        return c('Error').t`Require at least one action`;
    }
    return '';
};

const modelHasChanged = (a: SimpleFilterModalModel, b: SimpleFilterModalModel): boolean => {
    const cleanConditions = (c: Condition) => ({
        type: c.type,
        comparator: c.comparator,
        values: c.values,
    });

    if (
        a.name !== b.name ||
        a.statement !== b.statement ||
        !isDeepEqual(a.conditions.map(cleanConditions), b.conditions.map(cleanConditions)) ||
        !isDeepEqual(a.actions.labelAs.labels, b.actions.labelAs.labels) ||
        a.actions.moveTo.folder !== b.actions.moveTo.folder ||
        a.actions.markAs.read !== b.actions.markAs.read ||
        a.actions.markAs.starred !== b.actions.markAs.starred ||
        (a.actions.autoReply && b.actions.autoReply && a.actions.autoReply !== b.actions.autoReply)
    ) {
        return true;
    }

    return false;
};

const FilterModal = ({ filter, onClose = noop, ...rest }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const [filters = []] = useFilters();
    const [labels = [], loadingLabels] = useLabels();
    const [folders = [], loadingFolders] = useFolders();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const [loading, withLoading] = useLoading();
    const { createModal } = useModals();
    const isEdit = !!filter?.ID;

    const initializeModel = (filter?: Filter) => {
        const computedFilter = filter ? computeFromTree(filter) : {};

        const {
            Actions,
            Conditions,
            Operator,
        }: {
            Operator?: FilterOperator;
            Actions?: FilterActions;
            Conditions?: FilterCondition[];
        } = computedFilter || {};

        const foldersLabelsMap = Actions?.FileInto.reduce(
            (
                acc: {
                    folder: string[];
                    labels: string[];
                },
                folderOrLabel: string
            ) => {
                const defaultFolderNames = getDefaultFolders().map((f) => f.value);
                if (defaultFolderNames.includes(folderOrLabel) || folders?.find((f) => f.Path === folderOrLabel)) {
                    acc.folder = [folderOrLabel];
                }
                if (labels?.find((l) => l.Name === folderOrLabel)) {
                    acc.labels.push(folderOrLabel);
                }
                return acc;
            },
            { folder: [], labels: [] }
        );

        return {
            step: Step.NAME,
            id: filter?.ID,
            statement: Operator?.value || FilterStatement.ALL,
            name: filter?.Name || '',
            conditions:
                Conditions?.map((cond) => ({
                    type: cond.Type.value,
                    comparator: cond.Comparator.value,
                    values: isEdit ? cond.Values : [],
                    isOpen: true,
                    defaultValue: cond.Values[0] || '',
                    id: generateUID('condition'),
                })) || [],
            actions: {
                labelAs: {
                    labels: foldersLabelsMap?.labels || [],
                    isOpen: true,
                },
                moveTo: {
                    folder: foldersLabelsMap?.folder ? foldersLabelsMap?.folder[0] : undefined,
                    isOpen: true,
                },
                markAs: {
                    read: Actions?.Mark.Read || false,
                    starred: Actions?.Mark.Starred || false,
                    isOpen: true,
                },
                autoReply: Actions?.Vacation || null,
            },
        };
    };

    const [model, setModel] = useState<SimpleFilterModalModel>(initializeModel());

    const title = isEdit ? c('Title').t`Edit filter` : c('Title').t`Add filter`;

    const { name, conditions, actions } = model;

    const errors = useMemo<Errors>(() => {
        return {
            name: !model.name || filter?.Name !== name ? checkNameErrors(filters, name) : '',
            conditions: checkConditionsErrors(conditions),
            actions: checkActionsErrors(actions),
        };
    }, [name, actions, conditions]);

    const reqCreate = useApiWithoutResult<{ Filter: Filter }>(addTreeFilter);
    const reqUpdate = useApiWithoutResult<{ Filter: Filter }>(updateFilter);

    const createFilter = async (filter: Filter) => {
        try {
            const { Filter } = await reqCreate.request(filter);
            createNotification({
                text: c('Notification').t`${Filter.Name} created`,
            });
        } finally {
            // Some failed request will add the filter but in disabled mode
            // So we have to refresh the list in both cases
            await call();
            onClose();
        }
    };

    const editFilter = async (filter: Filter) => {
        const { Filter } = await reqUpdate.request(filter.ID, filter);
        await call();
        createNotification({
            text: c('Filter notification').t`Filter ${Filter.Name} updated`,
        });
        onClose();
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (isEdit) {
            await editFilter(convertModel(model));
            return;
        }

        await createFilter(convertModel(model));
    };

    const handleClose = () => {
        if (!modelHasChanged(model, initializeModel(filter))) {
            return onClose();
        }

        createModal(
            <ConfirmModal
                onConfirm={onClose}
                title={c('Title').t`Are you sure you want to close?`}
                confirm={<Button color="danger" type="submit">{c('Action').t`Discard`}</Button>}
            >
                <Alert>{c('Info').t`All your changes will be lost.`}</Alert>
                <Alert type="error">{c('Info').t`Are you sure you want to discard your changes?`}</Alert>
            </ConfirmModal>
        );
    };

    const renderStep = () => {
        switch (model.step) {
            case Step.NAME:
                return (
                    <FilterNameForm
                        isNarrow={isNarrow}
                        model={model}
                        onChange={(newModel) => setModel(newModel as SimpleFilterModalModel)}
                        errors={errors}
                        loading={loading}
                    />
                );
            case Step.CONDITIONS:
                return <FilterConditionsForm isEdit={isEdit} isNarrow={isNarrow} model={model} onChange={setModel} />;
            case Step.ACTIONS:
                return (
                    <FilterActionsForm
                        labels={labels}
                        folders={folders}
                        isNarrow={isNarrow}
                        model={model}
                        onChange={setModel}
                        isEdit={isEdit}
                    />
                );
            case Step.PREVIEW:
                return <FilterPreview labels={labels} folders={folders} isNarrow={isNarrow} model={model} />;
            default:
                return null;
        }
    };

    useEffect(() => {
        if (filter && !loadingFolders && !loadingLabels) {
            setModel(initializeModel(filter));
        }
    }, [loadingFolders, loadingLabels]);

    return (
        <FormModal
            title={title}
            onClose={handleClose}
            loading={loading || loadingLabels || loadingFolders}
            onSubmit={(event: FormEvent<HTMLFormElement>) => withLoading(handleSubmit(event))}
            footer={
                <FooterFilterModal
                    model={model}
                    errors={errors}
                    onChange={(newModel) => setModel(newModel as SimpleFilterModalModel)}
                    onClose={handleClose}
                    loading={loading}
                />
            }
            {...rest}
        >
            <HeaderFilterModal
                model={model}
                errors={errors}
                onChange={(newModel) => setModel(newModel as SimpleFilterModalModel)}
            />
            {loadingLabels || loadingFolders ? <Loader /> : renderStep()}
        </FormModal>
    );
};

export default FilterModal;
