import type { ItemRevision } from '@proton/pass/types';
import { ItemState } from '@proton/pass/types';

export const isTrashed = ({ state }: ItemRevision) => state === ItemState.Trashed;
