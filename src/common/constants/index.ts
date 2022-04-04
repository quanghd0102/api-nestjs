/* eslint-disable max-classes-per-file */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

/* eslint-disable @typescript-eslint/tslint/config */
export enum RECORD_STATUS {
  ACTIVE = 'ACTIVE',
  INACIVE = 'INACTIVE',
  DELETED = 'DELETED',
  PUBLISHED = 'PUBLISHED',
  PENDING = 'PENDING',
}

export interface IImage {
  url: string;
  name: string;
  width: number;
  height: number;
}

export class ImageType {
  @ApiProperty()
  url: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  width: number;

  @ApiProperty()
  height: number;

  @ApiProperty()
  originUrl: string;
}

export class I18nName {
  @ApiProperty()
  en: string;

  @ApiProperty()
  vi: string;

  @ApiProperty()
  fr: string;
}

@Schema()
export class ImageVariant {
  @ApiProperty()
  @Prop()
  url: string;

  @ApiProperty()
  @Prop()
  originUrl: string;

  @IsNumber()
  @ApiProperty()
  @Prop()
  width: number;

  @IsNumber()
  @ApiProperty()
  @Prop()
  height: number;

  @ApiProperty()
  @Prop()
  name: string;
}

export const imageVariantSchema = SchemaFactory.createForClass(ImageVariant);

@Schema()
export class I18String {
  @Prop()
  @ApiProperty()
  en?: string;

  @Prop()
  @ApiProperty()
  vi?: string;

  @Prop()
  @ApiProperty()
  fr?: string;
}

export const I18StringSchema = SchemaFactory.createForClass(I18String);
