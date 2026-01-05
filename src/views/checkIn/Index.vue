<template>
  <div class="checkin-page">
    <van-nav-bar title="活动签到" left-arrow @click-left="$router.back()" />

    <!-- 已签到状态 -->
    <div v-if="userStore.isCheckedIn" class="checked-box">
      <div class="success-icon">
        <van-icon name="checked" size="64" color="#fff" />
      </div>
      <h2>签到成功</h2>
      <p class="time">
        签到时间：{{ formatDate(userStore.checkInInfo?.checkInTime) }}
      </p>

      <van-cell-group inset class="info-group">
        <van-cell title="姓名" :value="userStore.checkInInfo?.realName" />
        <van-cell title="手机号" :value="userStore.checkInInfo?.phone" />
        <van-cell
          title="部门"
          :value="userStore.checkInInfo?.department || '-'"
        />
        <van-cell
          title="工号"
          :value="userStore.checkInInfo?.employeeNo || '-'"
        />
      </van-cell-group>

      <div class="back-btn">
        <van-button round block type="primary" @click="$router.replace('/')">
          返回首页
        </van-button>
      </div>
    </div>

    <!-- 未签到表单 -->
    <template v-else>
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

      <van-form @submit="handleSubmit" class="checkin-form">
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
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]"
          />
          <van-field
            v-model="form.department"
            name="department"
            label="部门"
            placeholder="请输入部门（选填）"
          />
          <van-field
            v-model="form.employeeNo"
            name="employeeNo"
            label="工号"
            placeholder="请输入工号（选填）"
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
            确认签到
          </van-button>
        </div>
      </van-form>
    </template>
  </div>
</template>

<script setup>
import { useActivityStore, useUserStore } from "@/store";
import { formatDate } from "@/utils/format";
import { showToast } from "vant";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userStore = useUserStore();
const activityStore = useActivityStore();

const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";

const form = reactive({
  realName: "",
  phone: "",
  department: "",
  employeeNo: "",
});

const submitting = ref(false);

// 自动填充上次签到信息
onMounted(async () => {
  // 确保活动信息已加载（从 localStorage 获取 activityId）
  if (!activityStore.activityId) {
    const activityId = localStorage.getItem("activityId");
    if (activityId) {
      await activityStore.init(activityId);
    }
  }

  // 获取用户信息（包含签到状态）
  await userStore.fetchUserInfo(activityStore.activityId);

  // 自动填充（用上次的签到信息）
  const checkInInfo = userStore.checkInInfo;
  if (checkInInfo && !checkInInfo.isCheckedIn) {
    form.realName = checkInInfo.realName || "";
    form.phone = checkInInfo.phone || "";
    form.department = checkInInfo.department || "";
    form.employeeNo = checkInInfo.employeeNo || "";
  }
});

const handleSubmit = async () => {
  if (!activityStore.activityId) {
    showToast("活动信息加载失败");
    return;
  }

  submitting.value = true;
  try {
    const result = await userStore.checkIn({
      activityId: activityStore.activityId,
      ...form,
    });

    showToast({ type: "success", message: "签到成功" });

    // 根据审核状态跳转
    if (result.checkIn?.status === 1) {
      // 免审核直接通过
      router.replace("/");
    } else {
      // 需要审核
      router.replace("/checkIn/status");
    }
  } catch (error) {
    console.error("签到失败:", error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.checkin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.checked-box {
  padding: 40px 20px;
  text-align: center;

  .success-icon {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4caf50, #8bc34a);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  h2 {
    font-size: 24px;
    color: #4caf50;
    margin-bottom: 8px;
  }

  .time {
    font-size: 14px;
    color: #666;
  }

  .info-group {
    margin-top: 30px;
    text-align: left;
  }

  .back-btn {
    padding: 30px 16px;
  }
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

.checkin-form {
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
