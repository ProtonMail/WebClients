import { EVENT_ACTIONS } from '../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

const defaultMerge = <T, Y>(oldModel: T, newModel: Partial<Y>): T => {
    return {
        ...oldModel,
        ...newModel,
    };
};

const defaultCreate = <T, Y>(newModel: T): Y => {
    return newModel as unknown as Y;
};

export type CreateEventItemUpdate<UpdateModel, PayloadKey extends string> = {
    ID: string;
    Action: typeof EVENT_ACTIONS.CREATE;
} & { [Key in PayloadKey]: UpdateModel };

export type UpdateEventItemUpdate<UpdateModel, PayloadKey extends string> = {
    ID: string;
    Action: typeof EVENT_ACTIONS.UPDATE;
} & { [Key in PayloadKey]: Partial<UpdateModel> };

export type DeleteEventItemUpdate = {
    ID: string;
    Action: typeof EVENT_ACTIONS.DELETE;
};

type Model<IdKey extends string> = {
    // The ID key is required and must be a string.
    [key in IdKey]: string;
};

export type EventItemUpdate<UpdateModel, PayloadKey extends string> =
    | CreateEventItemUpdate<UpdateModel, PayloadKey>
    | UpdateEventItemUpdate<UpdateModel, PayloadKey>
    | DeleteEventItemUpdate;

export const sortCollection = <T>(sortByKey: keyof T | undefined, array: T[]) => {
    if (!sortByKey) {
        return array;
    }
    return array.sort((a, b) => Number(a[sortByKey]) - Number(b[sortByKey]));
};

/**
 * Update a model collection with incoming events.
 *
 * IdKey defaults to "ID", Id to string|number.
 * Both EventItemModel and EventItemUpdateModel MUST have the IdKey.
 */
const updateCollection = <
    EventItemUpdateModel extends Model<IdKey>,
    EventItemModel extends Model<IdKey>,
    EventItemKey extends string,
    IdKey extends string = 'ID',
>({
    model = [],
    events = [],
    item,
    itemKey,
    merge = defaultMerge,
    create = defaultCreate,
    idKey = 'ID' as IdKey,
}: {
    model: readonly EventItemModel[] | undefined;
    events: readonly EventItemUpdate<EventItemUpdateModel, EventItemKey>[];
    item?: (
        event:
            | CreateEventItemUpdate<EventItemUpdateModel, EventItemKey>
            | UpdateEventItemUpdate<EventItemUpdateModel, EventItemKey>
    ) => Partial<EventItemUpdateModel> | undefined;
    create?: (a: EventItemUpdateModel) => EventItemModel;
    merge?: (a: EventItemModel, b: Partial<EventItemUpdateModel>) => EventItemModel;
    itemKey: EventItemKey;
    idKey?: IdKey;
}): EventItemModel[] => {
    const collection = [...model];

    const buckets = events.reduce<{
        [UPDATE]: Partial<EventItemUpdateModel>[];
        [CREATE]: Partial<EventItemUpdateModel>[];
        [DELETE]: Set<string>;
    }>(
        (acc, task) => {
            const id = task.ID;
            if (task.Action === DELETE) {
                acc[DELETE].add(id);
                return acc;
            }
            if (task.Action === UPDATE || task.Action === CREATE) {
                const value = item?.(task) ?? task[itemKey];
                if (value) {
                    acc[task.Action].push(value);
                }
            }
            return acc;
        },
        { [CREATE]: [], [UPDATE]: [], [DELETE]: new Set<string>() }
    );

    const todos = [...buckets[CREATE], ...buckets[UPDATE]];

    const indexById = collection.reduce<{ [key: string]: number }>((acc, element, index) => {
        const id = element[idKey];
        if (id !== undefined) {
            acc[id] = index;
        }
        return acc;
    }, Object.create(null));

    // NOTE: We cannot trust Action so "create" and "update" events need to be handled in this way by going through the original model.
    todos.forEach((element) => {
        const id = element[idKey];
        if (id === undefined) {
            return;
        }

        // Update.
        const index = indexById[id];
        if (index !== undefined) {
            collection[index] = merge(collection[index], element);
            return;
        }

        // Create. Assume it is never partial.
        const length = collection.push(create(element as EventItemUpdateModel));
        // Set index in case there is an UPDATE on this CREATEd item afterwards.
        indexById[id] = length - 1; // index
    });

    return collection.filter((it) => !buckets[DELETE].has(it[idKey]));
};

export default updateCollection;
