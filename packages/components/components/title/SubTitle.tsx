import React from 'react';

const SubTitle = ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...rest}>{children}</h2>;

export default SubTitle;
