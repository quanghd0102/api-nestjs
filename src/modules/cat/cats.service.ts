import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { IModel } from '../../interfaces';
import { BaseService } from '../../common/base.service';
import { CreateCatDto, UpdateCatDto } from './dto';
import { Cat, CatDocument } from './schemas/cat.entity';

@Injectable()
export class CatsService extends BaseService<
  CatDocument,
  CreateCatDto,
  UpdateCatDto
> {
  constructor(
    @InjectModel(Cat.name) private readonly _catModel: IModel<CatDocument>,
  ) {
    super(_catModel);
  }
}
