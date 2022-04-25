import { c } from 'ttag';
import noResultsImg from '@proton/styles/assets/img/illustrations/empty-search.svg';

import { UnderlineButton } from '../../components';

interface Props {
    query?: string;
    onClearSearch: () => void;
}

const EmptyResults = ({ query = '', onClearSearch }: Props) => {
    const title = c('Error message').t`No results found for "${query}"`;
    const button = (
        <UnderlineButton key="button" className="text-bold p0" onClick={onClearSearch}>
            {c('Action').t`clear it`}
        </UnderlineButton>
    );

    return (
        <div className="flex flex-column flex-align-items-center flex-item-fluid p0-5">
            <h2>{title}</h2>
            <img src={noResultsImg} alt={title} className="pl1 pr1 pb1 mb1" />
            <span>{c('Info').jt`You can either update your search query or ${button}`}</span>
        </div>
    );
};
export default EmptyResults;
