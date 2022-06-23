// NM types

export interface GenericResponse<T=any> {
    error?: string
    message: T
}
