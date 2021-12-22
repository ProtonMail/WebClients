import { forwardRef } from 'react';
import { Href } from '..';
import ButtonLike from './ButtonLike';

import './TwitterButton.scss';

interface Props {
    url?: string;
    target?: string;
    children: React.ReactNode;
}

const TwitterButton = forwardRef<HTMLAnchorElement, Props>((props, ref) => (
    <ButtonLike ref={ref} as={Href} className="twitter-button" shape="solid" {...props} />
));

TwitterButton.displayName = 'TwitterButton';

export default TwitterButton;
