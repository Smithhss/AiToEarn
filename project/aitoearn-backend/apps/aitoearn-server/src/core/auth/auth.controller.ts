import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { PasswordLoginDto } from './auth.dto'
import { AuthService } from './auth.service'

@ApiTags('Auth')
@Controller('login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiDoc({
    summary: 'Password login (single admin)',
    body: PasswordLoginDto.schema,
  })
  @Post('password')
  passwordLogin(@Body() body: PasswordLoginDto) {
    return this.authService.passwordLogin(body)
  }
}
