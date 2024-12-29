import '@fastify/jwt'

declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: {
			email: string
			id: string
			type: string
		}
		user: {
			email: string
			id: string
			type: string
		}
	}
}
