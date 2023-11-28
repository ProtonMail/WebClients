import { ReactNode } from 'react';

import { Card } from '@proton/atoms/Card';

interface Props {
    children: ReactNode;
    /**
     * Width in rem
     */
    width: number;
}

export const BankCard = ({ children, width }: Props) => {
    return (
        <Card
            className="relative colored-gradient-card flex my-4 mx-auto overflow-hidden h-custom w-custom color-white"
            style={{
                '--h-custom': `${width / 1.78}rem`,
                '--w-custom': `${width}rem`,
            }}
            rounded
        >
            {children}
        </Card>
    );
};
