import { EVENT_ACTIONS } from '../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

function getKeyToSortBy<T>(sortByKey: boolean | keyof T, todos: Partial<T>[]) {
    if (sortByKey === true) {
        const itemFromTodos = todos?.[0];
        if (!itemFromTodos) {
            return undefined;
        }
        return ['Order', 'Priority'].find((sortProperty) => sortProperty in itemFromTodos) as keyof T;
    }
    if (sortByKey === false) {
        return undefined;
    }
    return sortByKey;
}

const defaultMerge = <T>(oldModel: T, newModel: Partial<T>): T => {
    return {
        ...oldModel,
        ...newModel,
    };
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

/**
 * Update a model collection with incoming events.
 */
const updateCollection = <EventItemModel extends Model, EventItemKey extends string>({
    model = [],
    events = [],
    item,
    itemKey,
    merge = defaultMerge,
    sortByKey: maybeSortByKey = true,
}: {
    model: readonly EventItemModel[];
    events: readonly EventItemUpdate<EventItemModel, EventItemKey>[];
    item?: (
        event: CreateEventItemUpdate<EventItemModel, EventItemKey> | UpdateEventItemUpdate<EventItemModel, EventItemKey>
    ) => EventItemModelPartial<EventItemModel> | undefined;
    merge?: (a: EventItemModel, B: EventItemModelPartial<EventItemModel>) => EventItemModel;
    itemKey: EventItemKey;
    sortByKey?: boolean | keyof EventItemModel;
}): EventItemModel[] => {
    const copy = [...model];

    const todo = events.reduce<{
        [UPDATE]: EventItemModelPartial<EventItemModel>[];
        [CREATE]: EventItemModelPartial<EventItemModel>[];
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
            const length = acc.collection.push(element as EventItemModel);
            // Set index in case there is an UPDATE on this CREATEd item afterwards.
            acc.map[id] = length - 1; // index

            return acc;
        },
        {
            collection: copy,
            map: copiedMap,
        }
    );

    const filteredArray = collection.filter(({ ID }) => !todo[DELETE][ID]);
    const sortByKey = getKeyToSortBy(maybeSortByKey, todos);
    return sortByKey
        ? filteredArray.sort((itemA, itemB) => Number(itemA[sortByKey]) - Number(itemB[sortByKey]))
        : filteredArray;
};

export default updateCollection;
