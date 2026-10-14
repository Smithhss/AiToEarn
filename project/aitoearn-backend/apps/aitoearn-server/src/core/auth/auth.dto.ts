import { createZodDto } from '@yikart/common'
import { z } from 'zod'

const PasswordLoginSchema = z.object({
  password: z.string().min(1).max(256),
})

export class PasswordLoginDto extends createZodDto(PasswordLoginSchema) {}
