// -------------------------
// Either Type Definitions
// -------------------------
type MatchHandlers<L, R, T> = {
    left: (value: L) => T;
    right: (value: R) => T;
};

type Left<L> = {
    readonly _tag: 'Left';
    readonly left: L;

    match<T>(handlers: MatchHandlers<L, never, T>): T;
    map<T>(fn: (value: L) => T): Either<T, never>;
    flatMap<T>(fn: (value: L) => Either<T, never>): Either<T, never>;
};

type Right<R> = {
    readonly _tag: 'Right';
    readonly right: R;

    match<T>(handlers: MatchHandlers<never, R, T>): T;
    map<T>(fn: (value: R) => T): Either<never, T>;
    flatMap<T>(fn: (value: R) => Either<never, T>): Either<never, T>;
};

export type Either<L, R> = Left<L> | Right<R>;

// -------------------------
// Constructors (the only way to create Either)
// -------------------------
export const left = <L>(value: L): Either<L, never> =>
    Object.freeze({
        _tag: 'Left' as const,
        left: value,
        match: <T>(handlers: MatchHandlers<L, never, T>): T => handlers.left(value),
        map: <T>(fn: (value: L) => T): Either<T, never> => left(fn(value)),
        flatMap: <T>(fn: (value: L) => Either<T, never>): Either<T, never> => fn(value),
    });

export const right = <R>(value: R): Either<never, R> =>
    Object.freeze({
        _tag: 'Right' as const,
        right: value,
        match: <T>(handlers: MatchHandlers<never, R, T>): T => handlers.right(value),
        map: <T>(fn: (value: R) => T): Either<never, T> => right(fn(value)),
        flatMap: <T>(fn: (value: R) => Either<never, T>): Either<never, T> => fn(value),
    });
