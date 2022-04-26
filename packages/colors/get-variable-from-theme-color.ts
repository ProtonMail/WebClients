import { ThemeColor } from './types';

const getVariableFromThemeColor = (name: ThemeColor) =>
    name === 'norm' || name === 'weak' ? `--interaction-${name}` : `--signal-${name}`;

export default getVariableFromThemeColor;
