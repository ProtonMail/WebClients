import { LABEL_TYPE } from '../constants';

const { MESSAGE_LABEL, MESSAGE_FOLDER, CONTACT_GROUP } = LABEL_TYPE;

export const get = (Type: number) => ({
    url: 'v4/labels',
    method: 'get',
    params: { Type },
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
    url: 'v4/labels/order',
    data: { LabelIDs, ParentID, Type },
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
    url: 'v4/labels',
    data: { Name, Color, Type, Notify, ParentID, Expanded },
});

export const updateLabel = (
    labelID: string,
    {
        Name,
        Color,
        Notify,
        ParentID,
        Sticky,
        Expanded,
    }: { Name: string; Color: string; Notify?: number; ParentID?: string | number; Sticky?: number; Expanded?: number }
) => ({
    method: 'put',
    url: `v4/labels/${labelID}`,
    data: { Name, Color, Notify, ParentID, Sticky, Expanded },
});

export const deleteLabel = (labelID: string) => ({
    method: 'delete',
    url: `v4/labels/${labelID}`,
});

export const checkLabelAvailability = (params: { Name: string; Type: LABEL_TYPE; ParentID?: string | number }) => ({
    method: 'get',
    url: 'v4/labels/available',
    params,
});

export const getLabels = () => get(MESSAGE_LABEL);
export const getFolders = () => get(MESSAGE_FOLDER);
export const getContactGroup = () => get(CONTACT_GROUP);

export const orderFolders = (opt: PartialLabelOrderArgument) => order({ ...opt, Type: MESSAGE_FOLDER });
export const orderLabels = (opt: PartialLabelOrderArgument) => order({ ...opt, Type: MESSAGE_LABEL });
export const orderContactGroup = (opt: PartialLabelOrderArgument) => order({ ...opt, Type: CONTACT_GROUP });

export const createLabel = (opt: PartialCreateLabelArgument) => create({ ...opt, Type: MESSAGE_LABEL });
export const createContactGroup = (opt: PartialCreateLabelArgument) => create({ ...opt, Type: CONTACT_GROUP });
