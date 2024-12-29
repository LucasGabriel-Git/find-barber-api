import nodemailer from 'nodemailer'
import 'dotenv/config'
import { env } from './env'
export async function sendEmail(email: string, subject: string, text: string) {
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: env.MAIL_USER,
			pass: env.MAIL_PASSWORD,
		},
	})
	const mailOptions = {
		from: '"Barbershop" <iIiXo@example.com>',
		to: email,
		subject,
		text,
	}
	try {
		await transporter.sendMail(mailOptions)
	} catch (error) {
		if (error instanceof Error) {
			console.log(error.message)
		}
		throw new Error('Error sending email')
	}
}
