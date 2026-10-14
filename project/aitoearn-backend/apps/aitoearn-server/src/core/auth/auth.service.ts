import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { UserRepository, UserStatus } from '@yikart/mongodb'
import { timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../../config'
import { PasswordLoginDto } from './auth.dto'

/**
 * 单管理员口令登录。
 *
 * 全部参数来自环境变量（docker compose 的 .env 注入），不写入任何受版本控制的文件：
 *   - ADMIN_LOGIN_PASSWORD  登录口令；未设置时该登录方式整体关闭
 *   - ADMIN_LOGIN_MAIL      管理员邮箱，默认 admin@aitoearn.local
 *   - ADMIN_LOGIN_TOKEN_TTL 会话有效期，默认 7d
 *
 * 签名密钥直接取 config.yaml 的 auth.secret，确保与鉴权守卫校验时用的密钥一致。
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    if (bufA.length !== bufB.length) {
      // 长度不同也要做一次比较，避免通过耗时判断长度
      timingSafeEqual(bufA, bufA)
      return false
    }
    return timingSafeEqual(bufA, bufB)
  }

  /**
   * 校验口令并签发会话 JWT。口令不落库。
   */
  async passwordLogin(dto: PasswordLoginDto) {
    const adminMail = process.env['ADMIN_LOGIN_MAIL']?.trim() || 'admin@aitoearn.local'
    const tokenTtl = process.env['ADMIN_LOGIN_TOKEN_TTL']?.trim() || '7d'
    const jwtSecret = config.auth.secret
    const password = process.env['ADMIN_LOGIN_PASSWORD']?.trim()

    if (!password) {
      this.logger.error('ADMIN_LOGIN_PASSWORD is not set; password login is disabled')
      throw new UnauthorizedException('Password login is disabled')
    }
    if (!jwtSecret) {
      this.logger.error('auth.secret is empty in config.yaml; cannot sign session token')
      throw new UnauthorizedException('Login is not configured')
    }

    if (!this.safeEqual(dto.password, password)) {
      this.logger.warn('Password login failed')
      throw new UnauthorizedException('Invalid credentials')
    }

    const user = await this.userRepository.findByMail(adminMail)
    if (!user || user.isDelete || user.status !== UserStatus.OPEN) {
      throw new UnauthorizedException('Admin user not found')
    }

    const token = jwt.sign(
      { id: user.id, mail: user.mail, name: user.name },
      jwtSecret,
      { expiresIn: tokenTtl as jwt.SignOptions['expiresIn'] },
    )

    return { token, userInfo: user }
  }
}
