import { IsNotEmpty, MinLength } from 'class-validator';
import { Match } from 'src/common/decorators/match.decorator';

export class ChangePasswordDto {
  @IsNotEmpty()
  currentPassword: string;

  @MinLength(6)
  newPassword: string;

  @MinLength(6)
  @Match('newPassword', { message: 'Confirm password must match new password' })
  confirmNewPassword: string;
}
