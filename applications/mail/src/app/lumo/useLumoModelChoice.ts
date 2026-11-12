import { useUser } from '@proton/account/user/hooks';
import { useLocalStateSync } from '@proton/components/hooks/useLocalStateSync';
import type { LumoApiModelTier } from '@proton/lumo-api-client/core/chat-completions';

export enum LumoModelChoice {
    MAX = 'lumo-max',
    LITE = 'lumo-lite',
}

const LUMO_MODEL_KEY = 'lumo-in-mail-model';
const DEFAULT_CHOICE = LumoModelChoice.MAX;

// `satisfies` fails the type check if the API renames or drops a tier this enum names.
const isLumoModelChoice = (value: unknown): value is LumoModelChoice =>
    (Object.values(LumoModelChoice) satisfies LumoApiModelTier[]).includes(value as LumoModelChoice);

/** The model Lumo in Mail sends to, per user in this browser and synced across tabs. */
const useLumoModelChoice = (): [choice: LumoModelChoice, setChoice: (choice: LumoModelChoice) => void] => {
    const [user] = useUser();
    const [stored, setChoice] = useLocalStateSync<LumoModelChoice>(DEFAULT_CHOICE, `${LUMO_MODEL_KEY}-${user.ID}`);

    return [isLumoModelChoice(stored) ? stored : DEFAULT_CHOICE, setChoice];
};

export default useLumoModelChoice;
