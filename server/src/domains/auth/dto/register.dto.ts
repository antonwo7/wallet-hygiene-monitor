import { IsEmail, IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  nickname!: string

  @IsEmail()
  email!: string

  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsString()
  @MinLength(6)
  password!: string
}
