/**
 * 初始化脚本 - 仅创建默认管理员用户
 * 通过 docker-compose aitoearn-init 服务运行
 * 自托管部署使用口令登录，不再生成自动登录 token。
 */

import { MongoClient } from 'mongodb'
import crypto from 'crypto'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@mongodb:27017'
const DB_NAME = process.env.DB_NAME || 'aitoearn'
const DEFAULT_EMAIL = 'admin@aitoearn.local'

async function main() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  console.log('Connected to MongoDB')

  const db = client.db(DB_NAME)
  const users = db.collection('user')

  let user = await users.findOne({ mail: DEFAULT_EMAIL, isDelete: { $ne: true } })

  if (!user) {
    const now = new Date()
    const result = await users.insertOne({
      name: 'Admin',
      mail: DEFAULT_EMAIL,
      status: 1,
      userType: 'CREATOR',
      isDelete: false,
      score: 0,
      usedStorage: 0,
      storage: { total: 524288000 },
      locale: 'en-US',
      createdAt: now,
      updatedAt: now,
    })
    user = { _id: result.insertedId, mail: DEFAULT_EMAIL, name: 'Admin' }

    // 生成 popularizeCode（复用后端算法）
    const identifier = DEFAULT_EMAIL
    const phoneHash = crypto
      .createHash('sha256')
      .update(identifier)
      .digest('hex')
      .substring(0, 16)
    const combinedSalt = `aitoearn${phoneHash}`
    const hash = crypto
      .createHash('sha256')
      .update(user._id.toString())
      .update(combinedSalt)
      .digest('hex')
    const numericValue = parseInt(hash.substring(0, 6), 16)
    const code = numericValue
      .toString(36)
      .slice(-5)
      .toUpperCase()
      .padStart(5, '0')

    await users.updateOne({ _id: user._id }, { $set: { popularizeCode: code } })
    console.log(`Created default user: ${DEFAULT_EMAIL}`)
  } else {
    console.log(`Found existing user: ${DEFAULT_EMAIL}`)
  }

  // 自托管部署使用「口令登录」，不再签发长期自动登录 token。
  // 管理员身份由 aitoearn-server 的 /login/password 接口校验口令后签发短期 JWT。
  console.log('Auto-login token generation disabled.')

  await client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
