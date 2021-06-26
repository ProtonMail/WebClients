import React from 'react';
import { c } from 'ttag';

import Href from './Href';

export interface LearnMoreProps {
    url: string;
    className?: string;
}

const LearnMore = ({ url, className }: LearnMoreProps) => (
    <Href url={url} className={className}>{c('Link').t`Learn more`}</Href>
);

export default LearnMore;
