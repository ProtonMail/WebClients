import { LabelsModel } from 'proton-shared/lib/models/labelsModel';
import { LABEL_TYPE } from 'proton-shared/lib/constants';
import { Folder } from 'proton-shared/lib/interfaces/Folder';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { ContactGroup } from 'proton-shared/lib/interfaces/ContactGroup';

import createUseModelHook from './helpers/createModelHook';

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
    const labels = filterCategories(categories, LABEL_TYPE.MESSAGE_LABEL);
    return [labels, loading];
};

export const useFolders = (): [Folder[] | undefined, boolean] => {
    const [categories, loading] = useCategories();
    const folders = filterCategories(categories, LABEL_TYPE.MESSAGE_FOLDER);
    return [folders, loading];
};

export const useContactGroups = (): [ContactGroup[] | undefined, boolean] => {
    const [categories, loading] = useCategories();
    const contactGroups = filterCategories(categories, LABEL_TYPE.CONTACT_GROUP);
    return [contactGroups, loading];
};
