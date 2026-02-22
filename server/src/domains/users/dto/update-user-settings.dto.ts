import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator'

export class UpdateUserSettingsDto {
	@IsOptional()
	@IsBoolean()
	emailNotificationsEnabled?: boolean

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(10_000)
	emailMinRiskScore?: number
}
