export type Api = <T>(arg: object) => Promise<T>;

export interface ApiResponse {
    Code: number;
}
