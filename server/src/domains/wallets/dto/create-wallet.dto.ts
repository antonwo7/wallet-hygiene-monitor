import { Chain } from '@prisma/client'
import { IsEnum, IsString, Matches } from 'class-validator'

export class CreateWalletDto {
	@IsEnum(Chain)
	chain!: Chain

	@IsString()
	@Matches(/^0x[a-fA-F0-9]{40}$/)
	address!: string
}
