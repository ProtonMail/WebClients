export type Api = <T = any>(arg: object) => Promise<T>;

export interface ApiResponse {
    Code: number;
}
