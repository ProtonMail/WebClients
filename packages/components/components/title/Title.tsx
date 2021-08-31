import { HTMLAttributes } from 'react';

const Title = ({ children, ...rest }: HTMLAttributes<HTMLHeadingElement>) => <h1 {...rest}>{children}</h1>;

export default Title;
