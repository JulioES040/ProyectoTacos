import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Taco al pastor' }) @IsString() @IsNotEmpty() @MaxLength(80) name!: string;
  @ApiProperty({ example: 'Pastor marinado' }) @IsString() @IsNotEmpty() @MaxLength(160) description!: string;
  @ApiProperty({ example: 38, minimum: 0 }) @IsNumber() @Min(0) price!: number;
  @ApiProperty({ example: 'Tacos clasicos' }) @IsString() @IsNotEmpty() @MaxLength(60) category!: string;
  @ApiProperty({ example: true }) @IsBoolean() available!: boolean;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
