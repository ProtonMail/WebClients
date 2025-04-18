import type { ReactNode } from 'react';

interface Props {
    description: ReactNode;
}

const UpsellModalDescription = ({ description }: Props) => {
    if (!description) {
        return null;
    }

    if (typeof description === 'string') {
        return <p className="mt-2 mb-6 text-wrap-balance color-weak">{description}</p>;
    }

    return <div className="mt-2 mb-6 color-weak">{description}</div>;
};

export default UpsellModalDescription;
