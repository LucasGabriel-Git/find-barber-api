import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import Fastify from 'fastify'
import { userRoutes } from './routes/user-routes'
import { env } from './util/env'
const server = Fastify({
	logger: true,
})

server.register(fastifyJwt, {
	secret: env.JWT_SECRET,
})

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
server.decorate('authenticate', async (request: any, reply: any) => {
	try {
		await request.jwtVerify()
	} catch (err) {
		return reply.send(err)
	}
})

server.register(fastifyCors, {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
})

server.register(userRoutes, { prefix: '/api' })

server.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	console.log(`Server listening at ${address}`)
})
