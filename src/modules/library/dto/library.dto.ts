import { IsString, IsOptional, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(1)
  totalCopies: number;
}

export class CheckoutBookDto {
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsNotEmpty()
  borrowerEmail: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;
}
