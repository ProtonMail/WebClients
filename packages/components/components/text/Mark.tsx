import React, { ReactNode } from 'react';
import { normalize } from '@proton/shared/lib/helpers/string';
import { escapeRegex, getMatches } from '@proton/shared/lib/helpers/regex';
import Marks from './Marks';

interface Props {
    children?: ReactNode;
    value?: string;
}

const Mark = ({ children: text, value: search }: Props) => {
    if (!search || typeof text !== 'string') {
        return <>{text}</>;
    }
    const normalizedSearchText = normalize(search, true);
    const normalizedText = normalize(text, true);
    const regex = new RegExp(escapeRegex(normalizedSearchText), 'gi');
    const chunks = getMatches(regex, normalizedText);
    return <Marks chunks={chunks}>{text}</Marks>;
};

export default React.memo(Mark);
