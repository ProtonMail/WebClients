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
            text: c('Label for news').t`Proton company announcements`,
            frequency: c('Frequency of news').t`(1 email per quarter)`,
        },
        {
            id: 'features',
            flag: FEATURES,
            text: c('Label for news').t`Proton product announcements`,
            frequency: c('Frequency of news').t`(1-2 emails per month)`,
        },
        {
            id: 'business',
            flag: BUSINESS,
            text: c('Label for news').t`Proton for Business newsletter`,
            frequency: c('Frequency of news').t`(1 email per month)`,
        },
        {
            id: 'newsletter',
            flag: NEWSLETTER,
            text: c('Label for news').t`Proton newsletter`,
            frequency: c('Frequency of news').t`(1 email per month)`,
        },
        {
            id: 'beta',
            flag: BETA,
            text: c('Label for news').t`Proton beta announcements`,
            frequency: c('Frequency of news').t`(1-2 emails per month)`,
        },
    ];

    return (
        <ul className="unstyled relative">
            {checkboxes.map(({ id, flag, text, frequency }) => {
                return (
                    <li key={id} className="mb1 flex flex-align-items-center">
                        <Toggle
                            id={id}
                            className="mr1"
                            checked={hasBit(News, flag)}
                            disabled={disabled}
                            onChange={handleChange(flag)}
                        />
                        <label htmlFor={id} className="flex on-mobile-flex-column">
                            <span className="mr0-25">{text}</span>
                            {frequency}
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export default EmailSubscriptionCheckboxes;
