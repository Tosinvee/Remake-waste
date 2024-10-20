/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString, MinLength, } from "class-validator";

export class SignUpDto{
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    email:string;

    @IsString()
    @MinLength(9)
    password:string
}