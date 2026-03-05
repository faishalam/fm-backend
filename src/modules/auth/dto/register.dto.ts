import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @Matches(/^08[0-9]{8,12}$/, {
    message: 'Phone number must be a valid Indonesian number',
  })
  phoneNumber: string;

  @MinLength(6)
  password: string;
}
