import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema({ timestamps: true })
export class Token {
  @ApiProperty()
  // eslint-disable-next-line @typescript-eslint/tslint/config
  _id?: string;

  @Prop({ required: true, index: true })
  @ApiPropertyOptional()
  token: string;

  @Prop({ required: true, index: true })
  @ApiPropertyOptional()
  userId: string;

  @ApiPropertyOptional()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TokenSchema = SchemaFactory.createForClass(Token);
