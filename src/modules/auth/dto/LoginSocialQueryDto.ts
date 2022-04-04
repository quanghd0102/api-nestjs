/* eslint-disable @typescript-eslint/tslint/config */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginSocialQueryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  access_token: string;
}
