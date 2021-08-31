import { HTMLAttributes } from 'react';

export type SubTitleProps = HTMLAttributes<HTMLHeadingElement>;

const SubTitle = ({ children, ...rest }: SubTitleProps) => <h2 {...rest}>{children}</h2>;

export default SubTitle;
