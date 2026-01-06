import { get, post } from "@/utils/request";
// 获取用户信息
export function getUserInfo(activityId) {
  return get("/h5/user/info", { activityId });
}

// 签到
export function checkIn(data) {
  return post("/h5/user/checkIn", data);
}
