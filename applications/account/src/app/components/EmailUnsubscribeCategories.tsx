import React from 'react';
import { c } from 'ttag';

const EmailUnsubscribeCategories = ({ categories }: { categories: string[] }) => {
    const allCategoriesExceptTheLastOne = categories.slice(0, -1).join(', ');

    const lastCategory = categories[categories.length - 1];

    const categoriesString =
        categories.length > 1
            ? c('Email Unsubscribe Categories').t`${allCategoriesExceptTheLastOne} and ${lastCategory}`
            : lastCategory;

    return (
        <span key="bold" className="text-bold">
            {categoriesString}
        </span>
    );
};

export default EmailUnsubscribeCategories;
