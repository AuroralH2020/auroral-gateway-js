export type DltUser = {
    id: string,
    createdTimestamp: number,
    enabled: boolean,
    username: string,
    email: string,
    attributes: {
        cid: string
    }
}

export type DltUserCreate = {
    password: string,
    username: string,
    email: string,
    attributes: {
        cid: string
    }
}
