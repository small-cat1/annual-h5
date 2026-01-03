<template>
  <div class="register-page">
    <van-nav-bar title="员工报名" />
    
    <div class="user-info">
      <van-image
        round
        width="60"
        height="60"
        :src="userStore.avatar || defaultAvatar"
        fit="cover"
      />
      <p class="nickname">{{ userStore.nickname }}</p>
    </div>

    <van-form @submit="handleSubmit" class="register-form">
      <van-cell-group inset>
        <van-field
          v-model="form.realName"
          name="realName"
          label="真实姓名"
          placeholder="请输入真实姓名"
          :rules="[{ required: true, message: '请输入真实姓名' }]"
        />
        <van-field
          v-model="form.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          type="tel"
          maxlength="11"
          :rules="[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
          ]"
        />
        <van-field
          v-model="form.department"
          name="department"
          label="部门"
          placeholder="请选择部门"
          readonly
          is-link
          :rules="[{ required: true, message: '请选择部门' }]"
          @click="showDepartmentPicker = true"
        />
        <van-field
          v-model="form.employeeNo"
          name="employeeNo"
          label="工号"
          placeholder="请输入工号"
          :rules="[{ required: true, message: '请输入工号' }]"
        />
      </van-cell-group>

      <div class="submit-btn">
        <van-button 
          round 
          block 
          type="primary" 
          native-type="submit"
          :loading="submitting"
        >
          提交报名
        </van-button>
      </div>
    </van-form>

    <!-- 部门选择器 -->
    <van-popup v-model:show="showDepartmentPicker" position="bottom" round>
      <van-picker
        :columns="departmentOptions"
        @confirm="onDepartmentConfirm"
        @cancel="showDepartmentPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const form = reactive({
  realName: '',
  phone: '',
  department: '',
  employeeNo: ''
})

const submitting = ref(false)
const showDepartmentPicker = ref(false)

// 部门选项（可从后端获取）
const departmentOptions = [
  '技术部',
  '产品部',
  '设计部',
  '运营部',
  '市场部',
  '销售部',
  '财务部',
  '人事部',
  '行政部',
  '其他'
]

const onDepartmentConfirm = ({ selectedOptions }) => {
  form.department = selectedOptions[0]?.text || selectedOptions[0]
  showDepartmentPicker.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    await userStore.register(form)
    showToast({
      type: 'success',
      message: '报名成功'
    })
    
    // 根据审核配置跳转
    if (userStore.auditStatus === 1) {
      // 免审核直接通过
      router.replace('/')
    } else {
      // 需要审核
      router.replace('/register/status')
    }
  } catch (error) {
    console.error('报名失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);
  
  .nickname {
    margin-top: 12px;
    font-size: 16px;
    color: #fff;
  }
}

.register-form {
  margin-top: -20px;
  
  :deep(.van-cell-group) {
    border-radius: 12px;
    overflow: hidden;
  }
}

.submit-btn {
  padding: 30px 16px;
}
</style>
