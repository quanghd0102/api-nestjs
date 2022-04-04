import { isArray } from 'lodash';
import { Document } from 'mongoose';

import { IListDataPagination, IModel } from '../interfaces';

export abstract class BaseService<T extends Document, V, X> {
  // eslint-disable-next-line @typescript-eslint/tslint/config

  /**
   * The constructor must receive the injected model from the child service in
   * order to provide all the proper base functionality.
   *
   * @param {Model} model - The injected model.
   */
  constructor(private readonly _model: IModel<T>) {}

  async createOne(createBody: V): Promise<T> {
    return this._model.create(createBody);
  }

  async createMeOne(createBody: V & { userId: string }): Promise<T> {
    return this._model.create(createBody);
  }

  findAll(query): Promise<IListDataPagination<T>> {
    const search = this.getSearchQuery(query.q) || {};
    query.filter = { ...query.filter, ...search };
    return this._model.queryBuilder(query);
  }

  async findOne(id: string, query?: any): Promise<T> {
    let builder: any = this._model.findById(id);
    if (query?.includes) {
      if (isArray(query.includes)) {
        for (const po of query.includes) {
          builder = builder.populate(po);
        }
      } else {
        builder = builder.populate(query.includes);
      }
    }
    return builder.lean();
  }

  async updateOne(id: string, updateBody: X): Promise<T> {
    const record = await this._model.findById(id);
    if (!record) {
      throw Error('');
    }
    return this._model.findByIdAndUpdate(id, updateBody);
  }

  async removeOne(id: string): Promise<{
    success: boolean;
    id: string;
  }> {
    await this._model.findByIdAndRemove(id);
    return {
      id,
      success: true,
    };
  }

  getSearchQuery(q) {
    if (!q) {
      return null;
    }
  }
}
