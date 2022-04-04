import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class DetailQueryDto {
  @ApiPropertyOptional({
    description: 'Include the model separate by ",". EX: includes=user,job',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  @IsOptional()
  readonly includes: string;
}
