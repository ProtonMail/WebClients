import { useCallback, useMemo } from 'react';
import { LabelsModel } from '@proton/shared/lib/models/labelsModel';
import { LABEL_TYPE } from '@proton/shared/lib/constants';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import createUseModelHook from './helpers/createModelHook';
import useApi from './useApi';
import useCache from './useCache';
import { getPromiseValue } from './useCachedModelResult';

type Category = Folder & Label & ContactGroup;

const useCategories = createUseModelHook<Category[] | undefined>(LabelsModel);

const filterCategories = (categories: Category[] | undefined, type: number): Category[] | undefined => {
    if (!Array.isArray(categories)) {
        return;
    }
    return categories.filter(({ Type }: { Type: number }) => Type === type);
};

export const useLabels = (): [Label[] | undefined, boolean] => {
    const [categories, loading] = useCategories();
    const labels = useMemo(() => filterCategories(categories, LABEL_TYPE.MESSAGE_LABEL), [categories]);
    return [labels, loading];
};

export const useFolders = (): [Folder[] | undefined, boolean] => {
    const [categories, loading] = useCategories();
    const folders = useMemo(() => filterCategories(categories, LABEL_TYPE.MESSAGE_FOLDER), [categories]);
    return [folders, loading];
};

export const useContactGroups = (): [ContactGroup[] | undefined, boolean] => {
    const [categories, loading] = useCategories();
    const contactGroups = useMemo(() => filterCategories(categories, LABEL_TYPE.CONTACT_GROUP), [categories]);
    return [contactGroups, loading];
};

const filterContactGroups = (labels: Label[]) => labels.filter(({ Type }) => Type === LABEL_TYPE.CONTACT_GROUP);

export const useGetContactGroups = (): (() => Promise<ContactGroup[] | undefined>) => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => LabelsModel.get(api), [api]);
    return useCallback(() => {
        return getPromiseValue(cache, LabelsModel.key, miss).then(filterContactGroups);
    }, [cache, miss]);
};
