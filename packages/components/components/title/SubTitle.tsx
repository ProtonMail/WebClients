import React from 'react';

export type SubTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const SubTitle = ({ children, ...rest }: SubTitleProps) => <h2 {...rest}>{children}</h2>;

export default SubTitle;
