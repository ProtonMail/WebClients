import { IntervalTree } from '../interface';

interface UpsertCalendarEventInTreeArguments {
    oldStart?: number;
    oldEnd?: number;
    start: number;
    end: number;
    isOldRecurring: boolean;
    id: string;
    tree: IntervalTree;
}

const upsertCalendarEventInTree = ({
    oldStart,
    oldEnd,
    isOldRecurring,
    start,
    end,
    id,
    tree,
}: UpsertCalendarEventInTreeArguments) => {
    if (oldStart === undefined || oldEnd === undefined || isOldRecurring) {
        tree.insert(+start, +end, id);
        return;
    }
    if (start !== oldStart || end !== oldEnd) {
        // Interval changed
        tree.remove(oldStart, oldEnd, id);
        tree.insert(start, end, id);
    }
};

export default upsertCalendarEventInTree;
