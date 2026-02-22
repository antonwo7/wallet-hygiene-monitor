import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { Chain } from '@prisma/client'

export class AddTrustedSpenderDto {
	@IsEnum(Chain)
	chain!: Chain

	@IsString()
	spender!: string

	@IsOptional()
	@IsString()
	@MaxLength(100)
	label?: string
}
