import { c } from 'ttag';

import { BRAND_NAME, NEWS } from '@proton/shared/lib/constants';
import { hasBit, toggleBit } from '@proton/shared/lib/helpers/bitset';

import { Toggle } from '../../components';

const { ANNOUNCEMENTS, FEATURES, NEWSLETTER, BETA, BUSINESS, OFFERS } = NEWS;

export interface EmailSubscriptionCheckboxesProps {
    disabled: boolean;
    News: number;
    onChange: (News: number) => void;
}

export const getTitle = (news: NEWS) => {
    if (news === NEWS.ANNOUNCEMENTS) {
        return c('Label for news').t`${BRAND_NAME} company announcements`;
    }
    if (news === NEWS.FEATURES) {
        return c('Label for news').t`${BRAND_NAME} product announcements`;
    }
    if (news === NEWS.BUSINESS) {
        return c('Label for news').t`${BRAND_NAME} for Business newsletter`;
    }
    if (news === NEWS.NEWSLETTER) {
        return c('Label for news').t`${BRAND_NAME} newsletter`;
    }
    if (news === NEWS.BETA) {
        return c('Label for news').t`${BRAND_NAME} beta announcements`;
    }
    if (news === NEWS.OFFERS) {
        return c('Label for news').t`${BRAND_NAME} offers and promotions`;
    }
};

const EmailSubscriptionCheckboxes = ({ disabled, News, onChange }: EmailSubscriptionCheckboxesProps) => {
    const handleChange = (mask: number) => () => {
        onChange(toggleBit(News, mask));
    };

    const checkboxes = [
        {
            id: 'announcements',
            flag: ANNOUNCEMENTS,
            frequency: c('Frequency of news').t`(1 email per quarter)`,
        },
        {
            id: 'features',
            flag: FEATURES,
            frequency: c('Frequency of news').t`(1-2 emails per month)`,
        },
        {
            id: 'business',
            flag: BUSINESS,
            frequency: c('Frequency of news').t`(1 email per month)`,
        },
        {
            id: 'newsletter',
            flag: NEWSLETTER,
            frequency: c('Frequency of news').t`(1 email per month)`,
        },
        {
            id: 'beta',
            flag: BETA,
            frequency: c('Frequency of news').t`(1-2 emails per month)`,
        },
        {
            id: 'offers',
            flag: OFFERS,
            frequency: c('Frequency of news').t`(1 email per quarter)`,
        },
    ];

    return (
        <ul className="unstyled relative">
            {checkboxes.map(({ id, flag, frequency }) => {
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
                            <span className="mr0-25">{getTitle(flag)}</span>
                            {frequency}
                        </label>
                    </li>
                );
            })}
        </ul>
    );
};

export default EmailSubscriptionCheckboxes;
