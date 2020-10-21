import React from 'react';

export interface Props extends React.HTMLProps<HTMLDivElement> {
    amount: number;
    active: number;
}

const dotStyle = {
    display: 'inline-block',
    height: '8px',
    width: '8px',
    borderRadius: '50%',
    background: '#DDE6EC',
    marginRight: '4px',
};

const lastDotStyle = {
    marginRight: 'none',
};

const activeDotStyle = {
    background: '#3C414E',
};

const Dots = ({ amount, active, ...rest }: Props) => {
    const dots: React.ReactNode[] = [];

    for (let i = 0; i < amount; i++) {
        const isLast = i + 1 === amount;

        let style = dotStyle;

        if (i === active) {
            style = { ...style, ...activeDotStyle };
        }

        if (isLast) {
            style = { ...style, ...lastDotStyle };
        }

        const dot = <span style={style} />;

        dots.push(dot);
    }

    return <div {...rest}>{dots}</div>;
};

export default Dots;
