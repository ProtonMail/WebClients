import { forwardRef } from 'react';

import { ButtonLike, Href, HrefProps } from '@proton/atoms';

import './TwitterButton.scss';

interface Props extends Pick<HrefProps, 'href' | 'target'> {
    children: React.ReactNode;
}

const TwitterButton = forwardRef<HTMLAnchorElement, Props>((props, ref) => (
    <ButtonLike ref={ref} as={Href} className="twitter-button" shape="solid" {...props} />
));

TwitterButton.displayName = 'TwitterButton';

export default TwitterButton;
