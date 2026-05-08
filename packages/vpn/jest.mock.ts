global.AnimationEvent = class AnimationEvent extends Event implements AnimationEvent {
    private _animationName: string;

    private _elapsedTime: number;

    private _pseudoElement: string;

    constructor(type: string, animationEventInitDict: AnimationEventInit = {}) {
        const { animationName = '', elapsedTime = 0, pseudoElement = '', ...eventInitDict } = animationEventInitDict;
        super(type, eventInitDict);

        this._animationName = animationName;
        this._elapsedTime = elapsedTime;
        this._pseudoElement = pseudoElement;
    }

    get animationName() {
        return this._animationName;
    }

    get elapsedTime() {
        return this._elapsedTime;
    }

    get pseudoElement() {
        return this._pseudoElement;
    }
};
