import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { GeneratorService } from './services/generator.service';
import { ValidatorService } from './services/validator.service';

const providers = [ValidatorService, GeneratorService];

@Global()
@Module({
  providers,
  imports: [HttpModule],
  exports: [...providers, HttpModule],
})
export class SharedModule {}
