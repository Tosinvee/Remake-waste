/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/user/user.entity';
import * as bcrypt from "bcrypt"
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { Users } from './interfaces/user.interface';
import { SignUpDto } from './dtos/signup.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository:Repository<User>,
        private readonly configService:ConfigService,
        private readonly jwtService:JwtService,
        private mailService:MailService,
        private userService:UserService
    ){}

    async validateUser(email: string, password: string): Promise<Users | null> {
        const user = await this.userService.findByEmail(email);
    
        if (user && (await bcrypt.compare(password, user.password))) {
          if (!user.emailVerified) {
            await this.sendOtp(user.email);
            throw new BadRequestException('Email not verified. OTP sent to email.');
          }
          return { email: user.email, id: user.id, roles: [user.role] };
        }
        return null;
      }  

      async sendOtp(email: string): Promise<{ message: string }> {
        const otp = this.mailService.generateOtp(100000);
        const formattedOtp = await this.mailService.format(
          otp,
          'OTP Verification', 
        );
        const fromAddress = this.configService.get<string>('MAIL_FROM'); 
    
        const result = await this.mailService.sendMail({
          from: fromAddress,
          to: email,
          subject: 'OTP Verification', 
          html: formattedOtp,
        });
    
        if (result === 'Error sending email') {
          throw new BadRequestException('Error sending email');
        }
    
        await this.userRepository.update({ email }, { verificationCode: otp, createdAt: new Date() });
    
        return { message: 'OTP sent to email' };
      }

      async signup(user:SignUpDto):Promise<{message: string}>{
        const existingUser = await this.userService.findByEmail(user.email)
        if(existingUser){
          throw new BadRequestException('user already exists')
        }
        const hashedPassword = await bcrypt.hash(user.password, 10)
        await this.userRepository.save({
          email:user.email,
          password:hashedPassword
      })
      return await this.sendOtp(user.email)
      }

      
   async verifyEmail(email:string, otp:string):Promise<{message:string, access_token:string}>{
    const user = await this.userService.findByEmail(email)
    if(user.verificationCode === otp && this.mailService.verifyOtpTime(user.createdAt)){
        await this.userRepository.update({email}, {emailVerified:true})
        const payload ={email:user.email, sub:user.id, roles:[user.role]}
        return {
            message:'Email verified sucessfully',
            access_token:this.jwtService.sign(payload)
        }
    }
    throw new BadRequestException('Invalid OTP');
   } 
   
   async login(user: Users) {
    const payload = {email: user.email, sub: user.id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload, {expiresIn: '1h'}),
    };

  }

  async forgotPassword(email:string):Promise<{message:string}>{
    const user = await this.userService.findByEmail(email)
    if(!user){
      throw new BadRequestException(' User with this email does not exist')
    }
    await this.sendOtp(email)
    return{message:'Reset password otp sent to your email' 
    }
  }

  async resetPassword(email:string, newPassword:string): Promise<{message:string; access_token: string}>{
    const user = await this.userService.findByEmail(email)
    if(!user){
      throw new BadRequestException('user does not exist')
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await this.userRepository.update({email}, {password:hashedPassword})
    const payload = {email:user.email, sub:user.id, roles: [user.role]}
    return{
      message: 'password reset successfully',
      access_token:this.jwtService.sign(payload)
    }
  }

  async verifyOtp(email:string, otp:string):Promise<{message:string}>{
    const user = await this.userService.findByEmail(email)
    if(!user || user.verificationCode !== otp){
      throw new BadRequestException('Invalid OTP or email ');
    }
    await this.userRepository.update({email}, {verificationCode:null})
    return {message:'otp verified sucessfully you can now reset your password'}
  }

async assignAdmin(userId:string):Promise<Partial<User>>{
 const updatedUser = await this.userRepository.findOne({where:{id:userId}}) 

 if(!updatedUser){
  throw new BadRequestException('user not found')

 }
  
 await this.userRepository.update(userId, {role:'ADMIN'})

 updatedUser.role='ADMIN'

 if(updatedUser){
   const {password, verificationCode, emailVerified, ...result} = updatedUser
   return result
 }
 }


}




