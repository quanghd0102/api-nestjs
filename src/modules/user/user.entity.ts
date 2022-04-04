import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CatDocument = User & Document;

@Schema()
export class User {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop({ hidden: true })
  password: string;

  @Prop()
  age: number;

  @Prop()
  phone: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UserEntity = SchemaFactory.createForClass(User);
