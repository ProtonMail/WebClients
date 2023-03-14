import { c } from 'ttag';

import { Href } from '@proton/atoms';

export interface LearnMoreProps {
    url: string;
    className?: string;
}

/**
 * @deprecated please use Href
 */
const LearnMore = ({ url, className }: LearnMoreProps) => (
    <Href href={url} className={className}>{c('Link').t`Learn more`}</Href>
);

export default LearnMore;
