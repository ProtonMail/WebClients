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

export type EventItemModelPartial<EventItemModel> = Partial<EventItemModel>;

export type CreateEventItemUpdate<EventItemModel, EventItemKey extends string> = {
    ID: string;
    Action: EVENT_ACTIONS.CREATE;
} & { [key in EventItemKey]: EventItemModel };

export type UpdateEventItemUpdate<EventItemModel, EventItemKey extends string> = {
    ID: string;
    Action: EVENT_ACTIONS.UPDATE;
} & { [key in EventItemKey]: EventItemModelPartial<EventItemModel> };

export type DeleteEventItemUpdate = {
    ID: string;
    Action: EVENT_ACTIONS.DELETE;
};

export type EventItemUpdate<EventItemModel, EventItemKey extends string> =
    | CreateEventItemUpdate<EventItemModel, EventItemKey>
    | UpdateEventItemUpdate<EventItemModel, EventItemKey>
    | DeleteEventItemUpdate;

interface Model {
    ID: string;
}

export const sortCollection = <T>(sortByKey: keyof T | undefined, array: T[]) => {
    if (!sortByKey) {
        return array;
    }
    return array.sort((a, b) => Number(a[sortByKey]) - Number(b[sortByKey]));
};

/**
 * Update a model collection with incoming events.
 */
const updateCollection = <
    EventItemUpdateModel extends Model,
    EventItemModel extends Model,
    EventItemKey extends string,
>({
    model = [],
    events = [],
    item,
    itemKey,
    merge = defaultMerge,
    create = defaultCreate,
}: {
    model: readonly EventItemModel[] | undefined;
    events: readonly EventItemUpdate<EventItemUpdateModel, EventItemKey>[];
    item?: (
        event:
            | CreateEventItemUpdate<EventItemUpdateModel, EventItemKey>
            | UpdateEventItemUpdate<EventItemUpdateModel, EventItemKey>
    ) => EventItemModelPartial<EventItemUpdateModel> | undefined;
    create?: (a: EventItemUpdateModel) => EventItemModel;
    merge?: (a: EventItemModel, B: EventItemModelPartial<EventItemUpdateModel>) => EventItemModel;
    itemKey: EventItemKey;
}): EventItemModel[] => {
    const copy = [...model];

    const todo = events.reduce<{
        [UPDATE]: EventItemModelPartial<EventItemUpdateModel>[];
        [CREATE]: EventItemModelPartial<EventItemUpdateModel>[];
        [DELETE]: { [key: string]: boolean };
    }>(
        (acc, task) => {
            const { Action, ID } = task;

            if (Action === DELETE) {
                acc[DELETE][ID] = true;
                return acc;
            }

            if (Action === UPDATE || Action === CREATE) {
                const value = item?.(task) ?? task[itemKey];
                if (value) {
                    acc[Action].push(value);
                }
            }

            return acc;
        },
        { [UPDATE]: [], [CREATE]: [], [DELETE]: {} }
    );

    const todos = [...todo[CREATE], ...todo[UPDATE]];

    const copiedMap = copy.reduce<{ [key: string]: number }>((acc, element, index) => {
        acc[element.ID] = index;
        return acc;
    }, Object.create(null));

    // NOTE: We cannot trust Action so "create" and "update" events need to be handled in this way by going through the original model.
    const { collection } = todos.reduce<{ collection: EventItemModel[]; map: { [key: string]: number } }>(
        (acc, element) => {
            const id = element.ID;
            if (id === undefined) {
                return acc;
            }

            // Update.
            const index = acc.map[id];
            if (index !== undefined) {
                acc.collection[index] = merge(acc.collection[index], element);
                return acc;
            }

            // Create. Assume it is never partial.
            const length = acc.collection.push(create(element as EventItemUpdateModel));
            // Set index in case there is an UPDATE on this CREATEd item afterwards.
            acc.map[id] = length - 1; // index

            return acc;
        },
        {
            collection: copy,
            map: copiedMap,
        }
    );

    return collection.filter(({ ID }) => !todo[DELETE][ID]);
};

export default updateCollection;
