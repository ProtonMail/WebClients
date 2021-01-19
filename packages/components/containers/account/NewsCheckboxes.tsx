import React from 'react';
import { c } from 'ttag';
import { NEWS } from 'proton-shared/lib/constants';
import { toggleBit, hasBit } from 'proton-shared/lib/helpers/bitset';

import { Checkbox } from '../../components';

const { ANNOUNCEMENTS, FEATURES, NEWSLETTER, BETA, BUSINESS } = NEWS;

export interface NewsCheckboxesProps {
    disabled: boolean;
    News: number;
    onChange: (News: number) => void;
}

const NewsCheckboxes = ({ disabled, News, onChange }: NewsCheckboxesProps) => {
    const handleChange = (mask: number) => () => {
        onChange(toggleBit(News, mask));
    };

    const checkboxes = [
        {
            id: 'announcements',
            flag: ANNOUNCEMENTS,
            text: c('Label for news').t`Proton announcements (2-3 emails per year)`,
        },
        { id: 'features', flag: FEATURES, text: c('Label for news').t`Proton major features (3-4 emails per year)` },
        { id: 'business', flag: BUSINESS, text: c('Label for news').t`Proton for business (4-5 emails per year)` },
        { id: 'newsletter', flag: NEWSLETTER, text: c('Label for news').t`Proton newsletter (8-10 emails per year)` },
        { id: 'beta', flag: BETA, text: c('Label for news').t`Proton Beta (10-12 emails per year)` },
    ];

    return (
        <ul className="unstyled">
            {checkboxes.map(({ id, flag, text }) => {
                return (
                    <li key={id} className="mb0-5">
                        <Checkbox checked={hasBit(News, flag)} disabled={disabled} onChange={handleChange(flag)}>
                            {text}
                        </Checkbox>
                    </li>
                );
            })}
        </ul>
    );
};

export default NewsCheckboxes;
