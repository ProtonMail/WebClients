import { LABEL_TYPE } from '../constants';

const { MESSAGE_LABEL, MESSAGE_FOLDER, CONTACT_GROUP, SYSTEM_FOLDER } = LABEL_TYPE;

export const get = (Type: number) => ({
    url: 'core/v4/labels',
    method: 'get',
    params: { Type },
});

export const getByIds = (IDS: string[]) => ({
    url: `core/v4/labels/by-ids`,
    method: 'post',
    data: { LabelIDs: IDS },
});

interface PartialLabelOrderArgument {
    LabelIDs: string[];
    ParentID?: string | number;
}

interface LabelOrderArgument extends PartialLabelOrderArgument {
    Type: number;
}

export const order = ({ LabelIDs, ParentID, Type }: LabelOrderArgument) => ({
    method: 'put',
    url: 'core/v4/labels/order',
    data: { LabelIDs, ParentID, Type },
});

export const orderAllFolders = () => ({
    method: 'put',
    url: 'core/v4/labels/order/tree',
});

interface PartialCreateLabelArgument {
    Name: string;
    Color: string;
    ParentID?: string | number;
    Notify?: number;
    Expanded?: number;
    Sticky?: number;
}

interface CreateLabelArgument extends PartialCreateLabelArgument {
    Type: number;
}

export const create = ({ Name, Color, Type, Notify, ParentID, Expanded }: CreateLabelArgument) => ({
    method: 'post',
    url: 'core/v4/labels',
    data: { Name, Color, Type, Notify, ParentID, Expanded },
});

interface UpdateLabelArguments {
    Name: string;
    Color: string;
    Notify?: number;
    ParentID?: string | number;
    Sticky?: number;
    Expanded?: number;
    Display?: number;
}

export const updateLabel = (
    labelID: string,
    { Name, Color, Notify, ParentID, Sticky, Expanded, Display }: UpdateLabelArguments
) => ({
    method: 'put',
    url: `core/v4/labels/${labelID}`,
    data: { Name, Color, Notify, ParentID, Sticky, Expanded, Display },
});

export const deleteLabel = (labelID: string) => ({
    method: 'delete',
    url: `core/v4/labels/${labelID}`,
});

export const deleteLabels = (labelIDs: string[]) => ({
    method: 'delete',
    url: 'core/v4/labels',
    data: { LabelIDs: labelIDs },
});

export const checkLabelAvailability = (params: { Name: string; Type: LABEL_TYPE; ParentID?: string | number }) => ({
    method: 'get',
    url: 'core/v4/labels/available',
    params,
});

export const getLabels = () => get(MESSAGE_LABEL);
export const getFolders = () => get(MESSAGE_FOLDER);
export const getSystemFolders = () => get(SYSTEM_FOLDER);
export const getContactGroup = () => get(CONTACT_GROUP);

export const orderFolders = (opt: PartialLabelOrderArgument) => order({ ...opt, Type: MESSAGE_FOLDER });
export const orderLabels = (opt: PartialLabelOrderArgument) => order({ ...opt, Type: MESSAGE_LABEL });
export const orderSystemFolders = (opt: Pick<PartialLabelOrderArgument, 'LabelIDs'>) =>
    order({ ...opt, ParentID: undefined, Type: SYSTEM_FOLDER });
export const orderContactGroup = (opt: PartialLabelOrderArgument) => order({ ...opt, Type: CONTACT_GROUP });

export const createLabel = (opt: PartialCreateLabelArgument) => create({ ...opt, Type: MESSAGE_LABEL });
export const createContactGroup = (opt: PartialCreateLabelArgument) => create({ ...opt, Type: CONTACT_GROUP });

export const updateSystemFolders = (labelId: string, opt: Pick<UpdateLabelArguments, 'Color' | 'Name' | 'Display'>) =>
    updateLabel(labelId, { ...opt });
