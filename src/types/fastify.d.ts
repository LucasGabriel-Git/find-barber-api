import 'fastify';

declare module 'fastify' {
	interface FastifyInstance {
		jwt: FastifyJWT;
		authenticate: (
			request: FastifyRequest,
			reply: FastifyReply,
		) => Promise<void>;
	}
}
