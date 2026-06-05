import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { useCategoryToggle } from '@proton/mail/features/categoriesView/useCategoryToggle';

import MobileSection from '../MobileSection';
import MobileSectionLabel from '../MobileSectionLabel';
import MobileSectionRow from '../MobileSectionRow';

export const CategoriesToggle = () => {
    const { handleChange, loading, state } = useCategoryToggle();

    return (
        <MobileSection>
            <MobileSectionRow>
                <MobileSectionLabel htmlFor="category-view">{c('Label').t`Enable categories`}</MobileSectionLabel>
                <Toggle
                    id="category-view"
                    checked={state}
                    onChange={({ target }) => handleChange({ checked: target.checked, notification: true })}
                    loading={loading}
                />
            </MobileSectionRow>
        </MobileSection>
    );
};
