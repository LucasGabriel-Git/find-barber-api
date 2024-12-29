import z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	JWT_SECRET: z.string(),
	DATABASE_URL: z.string(),
	MAIL_USER: z.string(),
	MAIL_PASSWORD: z.string(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
