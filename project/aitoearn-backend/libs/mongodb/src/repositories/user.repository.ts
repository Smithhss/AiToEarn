import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { UserType } from '../enums'
import { User, UserAiInfo } from '../schemas'
import { BaseRepository, LeanDoc } from './base.repository'

export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User.name)
    userModel: Model<User>,
  ) {
    super(userModel)
  }

  override async getById(id: string): Promise<LeanDoc<User> | null> {
    let userInfo
    try {
      userInfo = await this.model.findById(id).lean({ virtuals: true }).exec()
    }
    catch {
      return null
    }
    return userInfo as LeanDoc<User> | null
  }

  /**
   * 按邮箱查找用户（用于口令登录）
   */
  async findByMail(mail: string): Promise<LeanDoc<User> | null> {
    return this.findOne({ mail, isDelete: { $ne: true } })
  }

  async updateAiConfigById(userId: string, aiConfig: Partial<UserAiInfo>): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { aiInfo: aiConfig } },
    )
    return res.modifiedCount > 0
  }

  async updateAiConfigItemById(userId: string, type: 'image' | 'edit' | 'video' | 'agent', value: {
    defaultModel: string
    option?: Record<string, any>
  }): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { [`aiInfo.${type}`]: { defaultModel: value.defaultModel, option: value.option } } },
    )
    return res.modifiedCount > 0
  }

  async updateUserTypeById(userId: string, userType: UserType): Promise<boolean> {
    const res = await this.model.updateOne(
      { _id: userId },
      { $set: { userType } },
    )
    return res.modifiedCount > 0
  }
}
