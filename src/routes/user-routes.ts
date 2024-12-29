import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '../prisma_client/client.prisma'
import { UserController } from '../controller/userController'

export const userRoutes: FastifyPluginAsync = async (app) => {
	const userController = new UserController()
	app.post('/user', userController.save)
	app.put('/user', userController.update)
	app.put('/confirm-account', userController.verifyAccount)
	app.post('/login', userController.login)
	app.get('/profile', userController.getUserLogged)
	app.get('/users', userController.list)
}
