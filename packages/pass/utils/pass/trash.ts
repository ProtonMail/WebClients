import { ItemRevision, ItemState } from '@proton/pass/types';

export const isTrashed = ({ state }: ItemRevision) => state === ItemState.Trashed;
