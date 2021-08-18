import { Price } from '@proton/components';
import { getTitle } from '../../helpers/title';

import mdx from './Price.mdx';

export default {
    component: Price,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => (
    <>
        <ul>
            <li>
                <Price currency="EUR">{6699}</Price>
            </li>
            <li>
                <Price currency="CHF">{7699}</Price>
            </li>
            <li>
                <Price currency="USD">{8699}</Price>
            </li>
        </ul>
    </>
);
