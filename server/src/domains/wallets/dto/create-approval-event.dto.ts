import { IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { ApprovalKind, Chain, RiskLevel } from '@prisma/client'

export class CreateApprovalEventDto {
	@IsString()
	walletId!: string

	@IsEnum(Chain)
	chain!: Chain

	@IsEnum(ApprovalKind)
	kind!: ApprovalKind

	@IsString()
	tokenAddress!: string

	@IsString()
	spender!: string

	@IsOptional()
	@IsString()
	rawValue?: string

	@IsOptional()
	@IsBoolean()
	approved?: boolean

	@IsString()
	txHash!: string

	@IsString()
	blockNumber!: string

	@IsInt()
	@Min(0)
	logIndex!: number

	@IsOptional()
	@IsDateString()
	timestamp?: string

	@IsOptional()
	@IsInt()
	riskScore?: number

	@IsOptional()
	@IsEnum(RiskLevel)
	riskLevel?: RiskLevel

	@IsOptional()
	@IsObject()
	riskMeta?: Record<string, any>
}
