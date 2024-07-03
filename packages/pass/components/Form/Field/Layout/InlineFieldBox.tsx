import type { FC, PropsWithChildren, ReactNode } from 'react';

import './InlineFieldBox.scss';

type Props = PropsWithChildren & { label: ReactNode };

export const InlineFieldBox: FC<Props> = ({ label, children }) => (
    <div className="pass-inline-field-box">
        <label>{label}</label>
        <div className="flex items-center justify-end">{children}</div>
    </div>
);
