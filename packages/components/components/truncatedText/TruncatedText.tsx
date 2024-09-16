import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import truncate from '@proton/utils/truncate';

interface Props {
    children: string;
    maxChars: number;
}

const TruncatedText = ({ children, maxChars }: Props) => {
    const [isShowingMore, setIsShowingMore] = useState(false);

    return (
        <>
            {isShowingMore ? children : truncate(children, maxChars)}{' '}
            {children.length > maxChars && (
                <InlineLinkButton
                    color="norm"
                    onClick={() => setIsShowingMore((prevState) => !prevState)}
                    className="align-baseline"
                >
                    {isShowingMore ? c('Action').t`Show less` : c('Action').t`Show more`}
                </InlineLinkButton>
            )}
        </>
    );
};

export default TruncatedText;
