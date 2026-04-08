import {email, z} from 'zod'
export const registerSchema = z.object({
    username: z.string().min(3, "username must be atleasat 3 characters"),
    email: z.email(),
    fullname: z.string().min(3, "Fullname must be atleasat 3 characters"),
    password: z.string().min(3, "Password must be atleast 3 characters"),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be atleast 8 characters"),
})
