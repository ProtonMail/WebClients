import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Category, Folder, Label } from '@proton/shared/lib/interfaces';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import noop from '@proton/utils/noop';

import { type CategoriesState, categoriesThunk, selectCategories } from './index';

const hooks = createHooks(categoriesThunk, selectCategories);

const useGetCategories = hooks.useGet;

type Result<T> = [T | undefined, boolean];
type FilterFunction<F> = (categories: Category[] | undefined) => F;

const createCategorySelector = <T>(filter: FilterFunction<T>) =>
    createSelector([(state: CategoriesState) => selectCategories(state)], (state): Result<T> => {
        return [filter(state.value), !state.value && !state.error];
    });

const filterCategories = <T extends Category>(categories: Category[] | undefined, type: number): T[] | undefined => {
    if (!Array.isArray(categories)) {
        return;
    }
    return categories.filter((category: { Type: number }): category is T => category.Type === type);
};

const filterContactGroups = (categories: Category[] | undefined) =>
    filterCategories<ContactGroup>(categories, LABEL_TYPE.CONTACT_GROUP);
const filterLabels = (categories: Category[] | undefined) =>
    filterCategories<Label>(categories, LABEL_TYPE.MESSAGE_LABEL);
const filterFolders = (categories: Category[] | undefined) =>
    filterCategories<Folder>(categories, LABEL_TYPE.MESSAGE_FOLDER);
const filterSystem = (categories: Category[] | undefined) =>
    filterCategories<Label>(categories, LABEL_TYPE.SYSTEM_FOLDER);

const labelsSelector = createCategorySelector(filterLabels);
const foldersSelector = createCategorySelector(filterFolders);
const systemSelector = createCategorySelector(filterSystem);
const contactGroupsSelector = createCategorySelector(filterContactGroups);

export const useGetLabels = () => {
    const get = useGetCategories();
    return useCallback(() => {
        return get().then(filterLabels);
    }, [get]);
};

export const useGetFolders = () => {
    const get = useGetCategories();
    return useCallback(() => {
        return get().then(filterFolders);
    }, [get]);
};

export const useLabels = () => {
    const get = useGetCategories();
    useEffect(() => {
        get().catch(noop);
    }, []);
    return baseUseSelector<CategoriesState, Result<Label[]>>(labelsSelector);
};

export const useFolders = () => {
    const get = useGetCategories();
    useEffect(() => {
        get().catch(noop);
    }, []);
    return baseUseSelector<CategoriesState, Result<Folder[]>>(foldersSelector);
};

export const useSystemFolders = () => {
    const get = useGetCategories();
    useEffect(() => {
        get().catch(noop);
    }, []);
    return baseUseSelector<CategoriesState, Result<Label[]>>(systemSelector);
};

export const useContactGroups = () => {
    const get = useGetCategories();
    useEffect(() => {
        get().catch(noop);
    }, []);
    return baseUseSelector<CategoriesState, Result<ContactGroup[]>>(contactGroupsSelector);
};

export const useGetContactGroups = () => {
    const get = useGetCategories();
    return useCallback(() => {
        return get().then(filterContactGroups);
    }, [get]);
};
