export const is4xx = (status: number) => status >= 400 && status < 500;

export const is5xx = (status: number) => status >= 500 && status < 600;
