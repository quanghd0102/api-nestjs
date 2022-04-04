import { Module } from '@nestjs/common';

import { EmailsService } from './email.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule {}
