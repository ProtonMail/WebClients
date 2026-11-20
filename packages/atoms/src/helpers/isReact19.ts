import { version } from 'react';

export const isReact19 = Number(version.split('.')[0]) >= 19;
