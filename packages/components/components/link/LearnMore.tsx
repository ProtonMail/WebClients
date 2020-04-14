import React from 'react';
import { c } from 'ttag';

import Href from './Href';

interface Props {
    url: string;
    className?: string;
}
const LearnMore = ({ url, className }: Props) => <Href url={url} className={className}>{c('Link').t`Learn more`}</Href>;

export default LearnMore;
