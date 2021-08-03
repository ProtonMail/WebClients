import * as React from 'react';

const Title = ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...rest}>{children}</h1>;

export default Title;
