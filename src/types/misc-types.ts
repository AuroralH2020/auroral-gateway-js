export type JsonType<T=any> = {
    [x: string]: T
}

export type BasicReponse<T=any> = {
    error?: string
    message?: T
}

export type KeyValue = {
    key: string,
    value: string
}

