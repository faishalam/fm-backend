import { IsOptional, IsNotEmpty, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  username?: string;

  @IsOptional()
  @Matches(/^08[0-9]{8,12}$/, {
    message: 'Phone number must be a valid Indonesian number',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsNotEmpty()
  avatar?: string;
}
