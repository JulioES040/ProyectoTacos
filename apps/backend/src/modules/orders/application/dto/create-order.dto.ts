import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CreateOrderLineDto {
  @ApiProperty({ example: 'pastor' }) @IsString() @IsNotEmpty() productId!: string;
  @ApiProperty({ example: 2, minimum: 1 }) @IsInt() @Min(1) quantity!: number;
  @ApiPropertyOptional({ example: ['cheese', 'avocado'], type: [String], description: 'Extras aplicados a cada unidad de esta linea.' }) @IsOptional() @IsArray() @IsString({ each: true }) extras?: string[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Cliente mostrador' }) @IsString() @IsNotEmpty() customer!: string;
  @ApiProperty({ enum: ['dine-in', 'takeaway'], example: 'dine-in' }) @IsIn(['dine-in', 'takeaway']) orderType!: 'dine-in' | 'takeaway';
  @ApiProperty({ type: [CreateOrderLineDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateOrderLineDto) items!: CreateOrderLineDto[];
}
