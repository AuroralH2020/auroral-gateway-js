// Types and Ifaces for res.locals

export type BasicAuthLocals = Record<string, any> | {
    oid: string,
	password: string
}
