import type { User } from '@prisma/client'
import { addHours } from 'date-fns'
import { compareSync, hash } from 'bcrypt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../prisma_client/client.prisma'
import { sendEmail } from '../../util/mailer'

export class UserController {
	async login(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email, password } = req.body as {
				email: string
				password: string
			}
			const user = await prisma.user.findFirst({
				where: { email },
				include: {
					barberShop: true,
					profile: true,
					queue: true,
					rating: true,
				},
			})

			if (!user) {
				return res.status(400).send({ error: 'User not found' })
			}

			if (!compareSync(password, String(user.password))) {
				return res.status(400).send({ error: 'Invalid password' })
			}

			const token = await res.jwtSign(
				{
					email: String(user?.email),
					id: String(user?.id),
					type: String(user?.type),
				},
				{ expiresIn: '1d' },
			)

			return res.status(200).send({ token, user })
		} catch (err) {
			return res.send(err)
		}
	}
	async save(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as User

			const hashedPassword = await hash(data.password, 6)

			const confirmationCode = Math.floor(
				100000 + Math.random() * 900000,
			).toString()
			const confirmationExpiresAt = addHours(new Date(), 2)
			await prisma.user
				.create({
					data: {
						...data,
						password: hashedPassword,
						confirmationCode,
						confirmationExpiresAt,
					},
				})
				.then(async (user) => {
					const emailText = `
					Hi, ${user.name}. \n\nYour confirmation code is ${user.confirmationCode} and expires in 2 hours.
					`
					await sendEmail(
						user.email,
						'Register confirmation - Barbershop',
						emailText,
					)

					return res.status(201).send(user)
				})
				.catch((err) => {
					return res.status(400).send(err)
				})
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send(error.message)
			}
		}
	}

	async verifyAccount(req: FastifyRequest, res: FastifyReply) {
		try {
			const authorizationHeader = req.headers.authorization
			if (!authorizationHeader) {
				return res.status(401).send({ error: 'Unauthorized' })
			}
			const { confirmationCode } = req.body as {
				confirmationCode: string
			}

			const decoded = (await req.jwtVerify()) as { id: string }

			const user = await prisma.user.findFirst({
				where: {
					id: decoded.id,
				},
			})

			if (user?.isVerified) {
				return res.status(400).send({ error: 'Account already verified' })
			}

			if (!user) {
				return res.status(400).send({ error: 'User not found' })
			}

			if (user.confirmationCode !== confirmationCode) {
				return res.status(400).send({ error: 'Invalid confirmation code' })
			}
			if (
				user.confirmationExpiresAt &&
				new Date() > user.confirmationExpiresAt
			) {
				return res.status(400).send({ error: 'Confirmation code expired' })
			}
			await prisma.user
				.update({
					where: {
						id: user.id,
					},
					data: {
						isVerified: true,
						confirmationCode: null,
						confirmationExpiresAt: null,
					},
				})
				.then(() => res.status(200).send({ message: 'Account verified' }))
				.catch((err) => res.status(400).send(err))
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async getUserLogged(req: FastifyRequest, res: FastifyReply) {
		try {
			const user = (await req.jwtDecode()) as {
				id: string
				email: string
				type: string
			}
			return res.send({ id: user.id, email: user.email, type: user.type })
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
	async list(req: FastifyRequest, res: FastifyReply) {
		try {
			const authorizationHeader = req.headers.authorization
			if (!authorizationHeader) {
				return res.status(401).send({ error: 'Unauthorized' })
			}
			const decoded = (await req.jwtVerify()) as { id: string }
			const users = await prisma.user.findMany()
			if (users.length > 0) {
				return res.status(200).send({ users })
			}

			return res.status(200).send({ message: 'No users found' })
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as User
			const decodedUser = (await req.jwtVerify()) as { id: string }

			const user = await prisma.user.findUnique({
				where: { id: decodedUser.id },
			})

			if (!user) {
				return res.status(400).send({ error: 'User not found' })
			}

			if (data.password) {
				const hashedPassword = await hash(data.password, 6)
				data.password = hashedPassword
			}

			await prisma.user
				.create({
					data,
				})
				.then(async (user) => {
					return res.status(201).send({
						message: 'User updated successfully',
						user,
					})
				})
				.catch((err) => {
					return res.status(400).send(err)
				})
		} catch (error) {}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const decoded = (await req.jwtVerify()) as { id: string }

			await prisma.user
				.delete({
					where: {
						id: decoded.id,
					},
				})
				.then(() =>
					res.status(200).send({ message: 'Your account has been deleted' }),
				)
				.catch((err) => res.status(400).send(err))
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
}
