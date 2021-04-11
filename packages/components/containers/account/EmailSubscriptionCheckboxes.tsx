import React from 'react';
import { c } from 'ttag';
import { NEWS } from 'proton-shared/lib/constants';
import { toggleBit, hasBit } from 'proton-shared/lib/helpers/bitset';

import { Toggle } from '../../components';

const { ANNOUNCEMENTS, FEATURES, NEWSLETTER, BETA, BUSINESS } = NEWS;

export interface EmailSubscriptionCheckboxesProps {
    disabled: boolean;
    News: number;
    onChange: (News: number) => void;
}

const EmailSubscriptionCheckboxes = ({ disabled, News, onChange }: EmailSubscriptionCheckboxesProps) => {
    const handleChange = (mask: number) => () => {
        onChange(toggleBit(News, mask));
    };

    const checkboxes = [
        {
            id: 'announcements',
            flag: ANNOUNCEMENTS,
            text: c('Label for news').t`Proton announcements`,
            frequency: c('Frequency of news').t`(2-3 emails per year)`,
        },
        {
            id: 'features',
            flag: FEATURES,
            text: c('Label for news').t`Proton major features`,
            frequency: c('Frequency of news').t`(3-4 emails per year)`,
        },
        {
            id: 'business',
            flag: BUSINESS,
            text: c('Label for news').t`Proton for business`,
            frequency: c('Frequency of news').t`(4-5 emails per year)`,
        },
        {
            id: 'newsletter',
            flag: NEWSLETTER,
            text: c('Label for news').t`Proton newsletter`,
            frequency: c('Frequency of news').t`(8-10 emails per year)`,
        },
        {
            id: 'beta',
            flag: BETA,
            text: c('Label for news').t`Proton Beta`,
            frequency: c('Frequency of news').t`(10-12 emails per year)`,
        },
    ];

    return (
        <ul className="unstyled relative">
            {checkboxes.map(({ id, flag, text, frequency }) => {
                return (
                    <li key={id} className="mb1 flex flex-align-items-center">
                        <Toggle
                            id={id}
                            className="mr2"
                            checked={hasBit(News, flag)}
                            disabled={disabled}
                            onChange={handleChange(flag)}
                        />
                        <label htmlFor={id} className="flex on-mobile-flex-column">
                            <span>{text} </span>
                            {frequency}
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export default EmailSubscriptionCheckboxes;
