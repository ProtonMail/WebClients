import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { PROTON_WEBSITES } from '@proton/shared/lib/constants';

import TopBanner from './TopBanner';

interface Props {
    errorMessage: string;
}
const UnreachableTopBanner = ({ errorMessage }: Props) => {
    // translator: At the end of a longer sentence "Servers are unreachable. Please try again in a few minutes. You can also check our status page"
    const statusPageLink = (
        <Href key="link" href={PROTON_WEBSITES.PROTON_STATUS_PAGE} target="_blank">{c('Error').t`status page`}</Href>
    );
    // translator: full sentence "Servers are unreachable. Please try again in a few minutes. You can also check our status page"
    const errorMessageWithStatusPage = c('Error').jt`${errorMessage}. You can also check our ${statusPageLink}`;

    return <TopBanner className="bg-danger">{errorMessageWithStatusPage}</TopBanner>;
};

export default UnreachableTopBanner;
