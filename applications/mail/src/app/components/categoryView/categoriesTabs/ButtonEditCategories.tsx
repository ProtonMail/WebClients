import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Spotlight, useModalState } from '@proton/components';

import { useSpotlightCategoriesCustomization } from '../categoriesOnboarding/useSpotlightCategoriesCustomization';
import { ModalEditCategories } from '../editCategories/ModalEditCategories';
import { PromptDisableCategories } from '../editCategories/PromptDisableCategories';

export const ButtonEditCategories = () => {
    const [editModalProps, setEditModal, renderEditModal] = useModalState();
    const [disableModalProps, setDisableModal, renderDisableModal] = useModalState();

    const spotlight = useSpotlightCategoriesCustomization({
        showEditModal: () => setEditModal(true),
    });

    const handleClick = () => {
        setEditModal(true);
        spotlight.onClose();
    };

    return (
        <>
            <Spotlight
                content={spotlight.spotlightContent}
                innerClassName="py-4 px-6"
                show={spotlight.shouldShowSpotlight}
                onDisplayed={spotlight.onDisplayed}
                hasClose={false}
                borderRadius="xl"
                style={{ maxWidth: '22.5rem' }}
            >
                <Button
                    icon
                    shape="ghost"
                    className="ml-2 color-weak hover:color-norm"
                    onClick={handleClick}
                    data-testid="edit-categories-button"
                >
                    <Icon name="sliders-2" alt={c('Action').t`Edit categories`} />
                </Button>
            </Spotlight>

            {renderEditModal && (
                <ModalEditCategories
                    onDisableAll={() => {
                        setDisableModal(true);
                    }}
                    {...editModalProps}
                />
            )}

            {renderDisableModal && <PromptDisableCategories {...disableModalProps} />}
        </>
    );
};
