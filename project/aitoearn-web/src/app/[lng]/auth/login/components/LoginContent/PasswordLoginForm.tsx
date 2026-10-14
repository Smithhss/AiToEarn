/**
 * PasswordLoginForm - 单管理员口令登录（自托管部署）
 * 自托管实例未接入邮件/短信服务，仅提供口令登录入口。
 */

'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { passwordLoginApi } from '@/api/auth/auth.api'

import { useTransClient } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserStore } from '@/store/user'
import { toast } from '@/utils/ui/toast'

export function PasswordLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { setToken, setUserInfo } = useUserStore()
  const { t } = useTransClient('login')

  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error(t('passwordRequired'))
      return
    }

    setSubmitting(true)
    try {
      const res = await passwordLoginApi({ password })
      if (res?.code === 0 && res.data?.token) {
        setToken(res.data.token)
        if (res.data.userInfo) {
          setUserInfo(res.data.userInfo)
        }
        toast.success(t('loginSuccess'))
        router.push(redirect || '/')
      }
      else {
        toast.error(res?.message || t('loginFailed'))
      }
    }
    catch {
      toast.error(t('loginError'))
    }
    finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder={t('passwordPlaceholder')}
        autoComplete="current-password"
        className="h-12 rounded-xl border-input bg-background px-4 text-base placeholder:text-muted-foreground/70 focus:border-ring focus:ring-0"
      />
      <Button
        type="submit"
        disabled={submitting}
        className="h-12 w-full rounded-xl text-base"
      >
        {submitting
          ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('waitingForActivation')}
              </>
            )
          : t('login')}
      </Button>
    </form>
  )
}
