import type { SecurityCheckupAction } from '@proton/shared/lib/interfaces/securityCheckup';

export interface IActions {
    phrase(): void;
    email(): void;
    phone(): void;
    emailOrPhone(): void;
    device(): void;
    toArray(): SecurityCheckupAction[];
}

export abstract class AbstractActions implements IActions {
    abstract actionsSet: Set<SecurityCheckupAction>;

    abstract phrase(): void;
    abstract email(): void;
    abstract phone(): void;
    abstract emailOrPhone(): void;
    abstract device(): void;

    public toArray() {
        return Array.from(this.actionsSet);
    }
}
