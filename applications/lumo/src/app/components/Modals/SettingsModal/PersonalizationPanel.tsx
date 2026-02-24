import React, {useEffect, useState} from 'react';

import {c} from 'ttag';

import {Banner} from '@proton/atoms/Banner/Banner';
import {Button} from '@proton/atoms/Button/Button';
import {ButtonLike} from '@proton/atoms/Button/ButtonLike';
import {Tooltip} from '@proton/atoms/Tooltip/Tooltip';
import {Icon, InputFieldTwo, SettingsLink, TextAreaTwo} from '@proton/components/index';
import {LUMO_SHORT_APP_NAME} from '@proton/shared/lib/constants';

import {useLumoUserSettings} from '../../../hooks';
import {useIsGuest} from '../../../providers/IsGuestProvider';
import {useLumoDispatch, useLumoSelector} from '../../../redux/hooks';
import {initialFeatureFlags} from '../../../redux/slices/featureFlags';
import type {LumoUserSettings} from '../../../redux/slices/lumoUserSettings';
import {saveLumoUserSettingsToRemote} from '../../../redux/slices/lumoUserSettingsThunks';
import {
    AVAILABLE_TRAITS,
    type PersonalizationSettings,
    resetPersonalizationSettings,
    savePersonalizationSettings,
    toggleTrait,
    updatePersonalizationSettings,
} from '../../../redux/slices/personalization';
import {safeLogger} from '../../../util/safeLogger';

import './PersonalizationPanel.scss';

// Rotating placeholders for different fields - using translatable strings
const getJobPlaceholders = () => [
    c('collider_2025: Job').t`Cat herder`,
    c('collider_2025: Job').t`Marketing manager`,
    c('collider_2025: Job').t`Professional cat napper`,
    c('collider_2025: Job').t`Chief Treat Distribution Officer`,
    c('collider_2025: Job').t`Senior Cardboard Box Inspector`,
    c('collider_2025: Job').t`Feline Behavior Consultant`,
    c('collider_2025: Job').t`Director of Windowsill Security`,
    c('collider_2025: Job').t`Professional Sunbeam Tester`,
    c('collider_2025: Job').t`Head of Yarn Ball Quality Control`,
];

const getNicknamePlaceholders = () => [
    `Mewlius caesar`,
    `Fluffy McFluffFace`,
    `Whiskers`,
    `Cleocatra`,
    `Mr. Mittens`,
    `Oedipuss`,
    `Morgan`,
    `Captain Fluffington`,
    `Oscar`,
    `Dolly Purrton`,
    `Sir Pounce-a-lot`,
];

const getContextPlaceholders = () => [
    c('collider_2025: Context').t`I speak fluent sarcasm and broken French`,
    c('collider_2025: Context').t`I have strong opinions about pineapple on pizza`,
    c('collider_2025: Context').t`I name all my houseplants after Renaissance painters`,
    c('collider_2025: Context').t`I believe cereal is a soup and I'm not sorry`,
    c('collider_2025: Context').t`I talk to my rubber duck for debugging help`,
    c('collider_2025: Context').t`I collect vintage error messages`,
    c('collider_2025: Context').t`I judge people based on their commit messages`,
    c('collider_2025: Context').t`I have a PhD in overthinking simple problems`,
    c('collider_2025: Context').t`I communicate primarily through GIFs and emoji`,
    c('collider_2025: Context').t`I'm powered by caffeine and existential dread`,
    c('collider_2025: Context').t`I believe tabs vs spaces is a human rights issue`,
    c('collider_2025: Context').t`I once spent 3 hours debugging a missing semicolon`,
    c('collider_2025: Context').t`I have trust issues with autocomplete`,
    c('collider_2025: Context').t`I'm on a first-name basis with Stack Overflow`,
    c('collider_2025: Context').t`I believe pizza is a vegetable if it has enough toppings`,
    c('collider_2025: Context').t`I prefer my explanations like my coffee: dark and bitter`,
];

const PersonalizationPanel = () => {
    const dispatch = useLumoDispatch();
    const personalization = useLumoSelector((state) => state.personalization);
    const isGuest = useIsGuest();

    // Safely get user settings with error handling
    let userSettings;
    try {
        const userSettingsHook = useLumoUserSettings();
        userSettings = userSettingsHook.lumoUserSettings;
    } catch {
        // Redux not available yet, this is expected during initial load
        userSettings = null;
    }

    const [placeholderIndices, setPlaceholderIndices] = useState({
        job: 0,
        nickname: 0,
        personality: 0,
        context: 0,
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedPersonalization, setLastSavedPersonalization] = useState<PersonalizationSettings | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // Initialize the saved state when component mounts
    // Only set it if personalization is empty (initial state), not if it has data from UserSettings
    useEffect(() => {
        if (
            !lastSavedPersonalization &&
            personalization &&
            !personalization.nickname &&
            !personalization.jobRole &&
            !personalization.additionalContext
        ) {
            setLastSavedPersonalization({ ...personalization });
        }
    }, [
        personalization.nickname,
        personalization.jobRole,
        personalization.additionalContext,
        lastSavedPersonalization,
    ]);

    // Manual sync: If userSettings has personalization data but personalization slice doesn't, sync it
    // Only do this during initial load, not when user is actively editing
    useEffect(() => {
        // Only sync on the very first load, never after user interaction
        if (!isInitialized && userSettings) {
            if (!hasUserInteracted && (userSettings as any).personalization) {
                dispatch(updatePersonalizationSettings((userSettings as any).personalization));
            }
            setIsInitialized(true);
        }
    }, [userSettings, dispatch, isInitialized, hasUserInteracted]);

    // Update lastSavedPersonalization when personalization data is loaded from UserSettings
    // Only do this once when data is first loaded, not on every change
    useEffect(() => {
        if (isInitialized && !lastSavedPersonalization && personalization) {
            // Set the baseline after initialization
            setLastSavedPersonalization({ ...personalization });
        }
    }, [isInitialized, lastSavedPersonalization, personalization]);

    // Mark as initialized if there's no userSettings data to sync from
    useEffect(() => {
        if (!isInitialized && (!userSettings || !(userSettings as any).personalization)) {
            setIsInitialized(true);
        }
    }, [userSettings, isInitialized]);

    // Get fresh translated placeholders
    const jobPlaceholders = getJobPlaceholders();
    const nicknamePlaceholders = getNicknamePlaceholders();
    const contextPlaceholders = getContextPlaceholders();

    // Rotate placeholders with staggered timing - each field rotates at different intervals
    useEffect(() => {
        const jobInterval = setInterval(() => {
            setPlaceholderIndices((prev) => ({
                ...prev,
                job: (prev.job + 1) % jobPlaceholders.length,
            }));
        }, 5000);

        const nicknameInterval = setInterval(() => {
            setPlaceholderIndices((prev) => ({
                ...prev,
                nickname: (prev.nickname + 1) % nicknamePlaceholders.length,
            }));
        }, 10000); // Slightly different timing to avoid simultaneous changes

        const contextInterval = setInterval(() => {
            setPlaceholderIndices((prev) => ({
                ...prev,
                context: (prev.context + 1) % contextPlaceholders.length,
            }));
        }, 15000); // Different timing again

        return () => {
            clearInterval(jobInterval);
            clearInterval(nicknameInterval);
            clearInterval(contextInterval);
        };
    }, [jobPlaceholders.length, nicknamePlaceholders.length, contextPlaceholders.length]);

    const handleInputChange = (field: keyof PersonalizationSettings, value: any) => {
        setHasUserInteracted(true);
        dispatch(updatePersonalizationSettings({ [field]: value }));
    };

    const handleTraitToggle = (traitId: string) => {
        setHasUserInteracted(true);
        const trait = AVAILABLE_TRAITS.find((t) => t.id === traitId);
        if (!trait) return;

        // Always add the trait (never remove it once clicked)
        // Add the sentence to the new lumoTraits field
        const currentTraits = personalization.lumoTraits.trim();
        const newTraits = currentTraits ? `${currentTraits} ${trait.sentence}` : trait.sentence;

        dispatch(updatePersonalizationSettings({ lumoTraits: newTraits }));
        dispatch(toggleTrait(traitId));
    };

    const handleReset = async () => {
        setHasUserInteracted(true);
        dispatch(resetPersonalizationSettings());

        // Save the reset state to persistent storage
        const resetState = {
            nickname: '',
            jobRole: '',
            personality: 'default' as const,
            traits: [],
            lumoTraits: '',
            additionalContext: '',
            enableForNewChats: true,
        };

        try {
            dispatch(savePersonalizationSettings(resetState));
            setLastSavedPersonalization({ ...resetState });
        } catch (error) {
            safeLogger.error('PersonalizationPanel: Failed to save reset personalization:', error);
        }
    };

    // Check if there are unsaved changes
    const hasUnsavedChanges = (() => {
        if (!personalization) return false;

        if (lastSavedPersonalization) {
            const hasChanges = JSON.stringify(personalization) !== JSON.stringify(lastSavedPersonalization);
            console.log('PersonalizationPanel: Checking unsaved changes:', {
                personalization,
                lastSavedPersonalization,
                hasChanges,
            });
            return hasChanges;
        }

        return personalization.nickname ||
            personalization.jobRole ||
            personalization.personality !== 'default' ||
            personalization.traits.length > 0 ||
            personalization.lumoTraits ||
            personalization.additionalContext;
    })();

    const handleSave = async () => {
        if (isSaving) {
            return;
        }

        setIsSaving(true);
        try {
            // First update the Redux state
            dispatch(savePersonalizationSettings(personalization));

            // Get the current user settings and update it with personalization
            const updatedUserSettings: LumoUserSettings = {
                theme: (userSettings as any)?.theme || 'auto',
                personalization,
                featureFlags: (userSettings as any)?.featureFlags || initialFeatureFlags,
            };

            // Directly save to remote API and wait for completion
            await dispatch(saveLumoUserSettingsToRemote(updatedUserSettings)).unwrap();

            setLastSavedPersonalization({ ...personalization });
        } catch (error) {
            safeLogger.error('PersonalizationPanel: Failed to save personalization:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="personalization-panel">
            <div className="personalization-content">
                {isGuest ? (
                    // Guest user: Show sign-in prompt
                    <div className="text-center py-6">
                        <Icon name="sliders" className="mb-4" size={6} />

                        <h3 className="text-bold mb-2">
                            {c('collider_2025: Personalization').t`Personalize your ${LUMO_SHORT_APP_NAME} experience`}
                        </h3>

                        <p className="color-weak mb-4 px-4">
                            {c('collider_2025: Personalization')
                                .t`Sign in or create a free account to customize how ${LUMO_SHORT_APP_NAME} interacts with you. Set your preferences, communication style, and more.`}
                        </p>

                        <div
                            className="flex flex-column items-center gap-2 max-w-custom mx-auto"
                            style={{ '--max-w-custom': '20rem' }}
                        >
                            <ButtonLike as={SettingsLink} color="norm" shape="solid" path="/signup" className="w-full">
                                {c('collider_2025: Link').t`Create a free account`}
                            </ButtonLike>

                            <ButtonLike as={SettingsLink} path="" shape="outline" color="weak" className="w-full">
                                {c('collider_2025: Link').t`Sign in`}
                            </ButtonLike>
                        </div>

                        <p className="text-sm color-weak mt-4">
                            <Icon name="lock" size={3} className="mr-1" />
                            {c('collider_2025: Info').t`Your information is zero-access encrypted`}
                        </p>
                    </div>
                ) : (
                    // Authenticated user: Show personalization form
                    <>
                        <Banner className={'mt-0 mb-4'}>
                            {c('Info').t`This information is zero-access encrypted.`}
                        </Banner>

                        <div className="flex flex-column gap-3">
                            {/* Nickname */}
                            <div className="personalization-field">
                                <InputFieldTwo
                                    label={c('Label').t`What should ${LUMO_SHORT_APP_NAME} call you?`}
                                    placeholder={nicknamePlaceholders[placeholderIndices.nickname]}
                                    value={personalization.nickname}
                                    assistContainerClassName="hidden"
                                    onChange={(e) => handleInputChange('nickname', e.target.value)}
                                />
                            </div>

                            {/* Job/Role */}
                            <div className="personalization-field mt-2">
                                <InputFieldTwo
                                    label={c('Label').t`What do you do?`}
                                    placeholder={jobPlaceholders[placeholderIndices.job]}
                                    value={personalization.jobRole}
                                    assistContainerClassName="hidden"
                                    onChange={(e) => handleInputChange('jobRole', e.target.value)}
                                />
                            </div>

                            {/* Additional Context */}
                            <div className="personalization-field mt-2">
                                <div className="flex flex-column gap-2">
                                    <InputFieldTwo
                                        as={TextAreaTwo}
                                        label={c('Label')
                                            .t`Anything else ${LUMO_SHORT_APP_NAME} should know about you?`}
                                        placeholder={contextPlaceholders[placeholderIndices.context]}
                                        value={personalization.additionalContext}
                                        assistContainerClassName="hidden"
                                        onChange={(e) => handleInputChange('additionalContext', e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            {/* Traits */}
                            <div className="personalization-field mt-2">
                                {/* Lumo Traits Text Area - shows selected traits */}
                                <InputFieldTwo
                                    as={TextAreaTwo}
                                    label={c('Label').t`How should ${LUMO_SHORT_APP_NAME} behave?`}
                                    placeholder={c('Placeholder').t`Selected traits will appear here automatically`}
                                    value={personalization.lumoTraits}
                                    assistContainerClassName="hidden"
                                    onChange={(e) => handleInputChange('lumoTraits', e.target.value)}
                                    rows={5}
                                />

                                {/* Trait Pills - only show unselected traits */}
                                <div className="trait-pills flex flex-wrap gap-1 mb-2">
                                    {AVAILABLE_TRAITS.filter((trait) => !personalization.traits.includes(trait.id)).map(
                                        (trait) => (
                                            <Tooltip key={trait.id} title={trait.description}>
                                                <Button
                                                    size="small"
                                                    shape="outline"
                                                    color="weak"
                                                    className="trait-pill"
                                                    onClick={() => handleTraitToggle(trait.id)}
                                                >
                                                    <Icon name="plus" size={3} className="mr-1" />
                                                    {trait.label}
                                                </Button>
                                            </Tooltip>
                                        )
                                    )}

                                    {/* Show message when all traits are selected */}
                                    {AVAILABLE_TRAITS.length === personalization.traits.length && (
                                        <div className="text-sm color-weak italic">All traits have been selected</div>
                                    )}

                                    {/* Reset traits button - only show if traits are selected */}
                                    {personalization.traits.length > 0 && (
                                        <Tooltip
                                            title={c('Tooltip').t`Clear all selected traits and restore trait buttons`}
                                        >
                                            <Button
                                                size="small"
                                                shape="ghost"
                                                color="weak"
                                                className="trait-reset"
                                                onClick={() => {
                                                    setHasUserInteracted(true);
                                                    dispatch(
                                                        updatePersonalizationSettings({
                                                            traits: [],
                                                            lumoTraits: '',
                                                        })
                                                    );
                                                }}
                                            >
                                                <Icon name="arrow-rotate-right" size={3} />
                                            </Button>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Fixed Footer - only show for authenticated users */}
            {!isGuest && (
                <div className="personalization-footer flex items-center">
                    <Button
                        color="danger"
                        shape="outline"
                        size="small"
                        onClick={handleReset}
                        disabled={
                            !personalization.nickname &&
                            !personalization.jobRole &&
                            personalization.personality === 'default' &&
                            personalization.traits.length === 0 &&
                            !personalization.lumoTraits &&
                            !personalization.additionalContext
                        }
                    >
                        {c('Action').t`Reset all`}
                    </Button>
                    <div className="flex-1" />
                    <Button
                        color="norm"
                        size="small"
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        loading={isSaving}
                    >
                        {isSaving ? c('Action').t`Saving...` : c('Action').t`Save`}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PersonalizationPanel;
