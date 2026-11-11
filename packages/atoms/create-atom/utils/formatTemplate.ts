import { formatSource } from '@proton/oxfmt-config/formatSource';

const formatTemplate = (text: string, fileName = 'file.tsx') => formatSource(fileName, text);

export default formatTemplate;
