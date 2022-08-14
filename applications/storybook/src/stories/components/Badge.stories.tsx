import { Badge } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Badge.mdx';

export default {
    component: Badge,
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = () => <Badge type="primary">Primary</Badge>;

export const Colors = () => (
    <>
        <Badge>Badge</Badge>
        <Badge type="primary">Primary</Badge>
        <Badge type="error">Error</Badge>
        <Badge type="success">Success</Badge>
        <Badge type="origin">Origin</Badge>
        <Badge type="light">Origin</Badge>
        <Badge type="warning">Warning</Badge>
    </>
);

export const WithClassName = () => <Badge className="text-bold">Bold</Badge>;

export const WithTooltip = () => (
    <Badge tooltip="Boo!" type="warning">
        Hover me
    </Badge>
);
