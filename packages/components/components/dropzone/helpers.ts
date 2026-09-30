import type { DragEvent } from 'react';

export const isDragFile = (event: DragEvent) => event.dataTransfer?.types?.includes('Files');
