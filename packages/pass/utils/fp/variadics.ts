export const unary =
    <A, B>(fn: (arg1: A) => B) =>
    (arg1: A) =>
        fn(arg1);

export const diadic =
    <A, B, C>(fn: (arg1: A, arg2: B) => C) =>
    (arg1: A, arg2: B) =>
        fn(arg1, arg2);
