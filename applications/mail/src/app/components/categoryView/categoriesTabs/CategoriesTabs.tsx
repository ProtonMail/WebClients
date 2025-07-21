import { categoriesArray } from '../categoriesConstants';
import { Tab } from './Tab';

import './CategoriesTabs.scss';

interface Props {
    labelID: string;
}

// In the future, we will only display the categories the user has enabled
export const CategoriesTabs = ({ labelID }: Props) => {
    return (
        <div
            className="categories-tabs flex flex-row flex-nowrap h-fit-content border-bottom border-weak"
            data-testid="categories-tabs"
        >
            {categoriesArray.map((category) => (
                <Tab
                    key={category.id}
                    id={category.id}
                    icon={category.icon}
                    colorShade={category.colorShade}
                    active={labelID === category.id}
                />
            ))}
        </div>
    );
};
