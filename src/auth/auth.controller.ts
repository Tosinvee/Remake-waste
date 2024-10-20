/* eslint-disable prettier/prettier */
import { Body, Controller, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/signup.dto';
import { LocalAuthGuard } from './guards/local-auth-guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService:AuthService){}
  @Public()
    @Post('signup')
    async signup(@Body() signUpDto:SignUpDto){
        return this.authService.signup(signUpDto)
    }

    @Public()
    @Post('verify-email')
    async verifyEmail(@Body() dto:{email:string; otp:string}){
        return this.authService.verifyEmail(dto.email, dto.otp)
    }

  @Public()
  @Post('signin')
    @UseGuards(LocalAuthGuard)
    login(@Request() req:any ){
        return this.authService.login(req.user)
    }

    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body() dto:{email:string}){
      return this.authService.forgotPassword(dto.email)

    }

    @Public()
    @Post('verify-otp')
  async verifyOtp(@Body() dto:{email:string, otp:string}){
    return this.authService.verifyOtp(dto.email, dto.otp)
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto:{email:string, password:string}){
   return this.authService.resetPassword(dto.email, dto.password)
  } 

  @Post('assign-admin')
  async assignAdmin(@Req() req:Request){
    const userId = (req as any).user.id
    return this.authService.assignAdmin(userId)
  }
}
