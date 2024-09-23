import { c } from 'ttag';

import UnderlineButton from '@proton/components/components/button/UnderlineButton';
import noResultsImg from '@proton/styles/assets/img/illustrations/empty-search.svg';

interface Props {
    query?: string;
    onClearSearch: () => void;
}

const ContactSelectorEmptyResults = ({ query = '', onClearSearch }: Props) => {
    const title = c('Error message').t`No results found for "${query}"`;
    const button = (
        <UnderlineButton key="button" className="text-bold p-0" onClick={onClearSearch}>
            {c('Action').t`clear it`}
        </UnderlineButton>
    );

    return (
        <div className="flex flex-column items-center flex-1 p-2">
            <h2>{title}</h2>
            <img src={noResultsImg} alt={title} className="px-4 pb-4 mb-4" />
            <span>{c('Info').jt`You can either update your search query or ${button}`}</span>
        </div>
    );
};
export default ContactSelectorEmptyResults;
