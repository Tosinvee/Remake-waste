/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';
import mailConfig from './mailConfig';

@Module({
  imports:[ConfigModule.forFeature(mailConfig)],
  providers: [MailService],
  exports:[MailService],

})
export class MailModule {}
