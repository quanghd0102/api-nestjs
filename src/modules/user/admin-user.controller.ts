import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../decorators';
import { UserPagingDto } from './dto/UserPagingDto';
import { UsersPageOptionsDto } from './dto/UsersPageOptionsDto';
import { UserService } from './user.service';

@Controller('admin/users')
@ApiTags('admin/users')
export class AdminUserController {
  constructor(private _userService: UserService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: UserPagingDto,
    description: 'List of users',
  })
  @Auth(['admin'])
  getUsers(
    @Query(new ValidationPipe({ transform: true }))
    pageOptionsDto: UsersPageOptionsDto,
  ): Promise<UserPagingDto> {
    return this._userService.getUsers(pageOptionsDto);
  }
}
