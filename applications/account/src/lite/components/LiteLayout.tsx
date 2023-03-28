import { ReactNode } from 'react';

import '../../app/public/Layout.scss';

interface Props {
    children: ReactNode;
}

const LiteLayout = ({ children }: Props) => {
    return <div className="sign-layout-bg h100">{children}</div>;
};

export default LiteLayout;
