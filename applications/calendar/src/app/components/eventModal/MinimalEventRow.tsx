import { Label, Row as LibRow } from 'react-components';
import React from 'react';

interface Props {
    children: React.ReactNode;
    label?: React.ReactChild;
    className?: string;
    labelFor?: string;
}
const MinimalEventRow = ({ children, label = '', className, labelFor }: Props) => (
    <LibRow collapseOnMobile={false}>
        <Label htmlFor={labelFor}>{label}</Label>
        <div className={className || 'flex-item-fluid'}>{children}</div>
    </LibRow>
);

export default MinimalEventRow;
