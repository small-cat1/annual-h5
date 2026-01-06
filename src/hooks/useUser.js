// 用户 Hook
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/modules/user'

export function useUser() {
  const userStore = useUserStore()
  const loading = ref(false)

  const userInfo = computed(() => userStore.userInfo)
  const userId = computed(() => userStore.userId)
  const nickname = computed(() => userStore.nickname)
  const avatar = computed(() => userStore.avatar)
  const realName = computed(() => userStore.userInfo?.realName)
  const phone = computed(() => userStore.userInfo?.phone)
  const department = computed(() => userStore.userInfo?.department)
  const employeeNo = computed(() => userStore.userInfo?.employeeNo)


  /**
   * 更新用户信息
   */
  const updateUser = (data) => {
    userStore.updateUserInfo(data)
  }

  return {
    userInfo,
    userId,
    nickname,
    avatar,
    realName,
    phone,
    department,
    employeeNo,
    loading,
    updateUser
  }
}
