// Token 管理
import { getSession, removeSession, setSession } from "./storage";

const TOKEN_KEY = "token";
const USER_KEY = "user";

/**
 * 获取 Token
 * @returns {string|null}
 */
export function getToken() {
  return getSession(TOKEN_KEY);
}

/**
 * 设置 Token
 * @param {string} token
 */
export function setToken(token) {
  setSession(TOKEN_KEY, token);
}

/**
 * 移除 Token
 */
export function removeToken() {
  removeSession(TOKEN_KEY);
}

/**
 * 获取用户信息
 * @returns {object|null}
 */
export function getUser() {
  return getSession(USER_KEY);
}

/**
 * 设置用户信息
 * @param {object} user
 */
export function setUser(user) {
  setSession(USER_KEY, user);
}

/**
 * 移除用户信息
 */
export function removeUser() {
  removeSession(USER_KEY);
}

/**
 * 清除登录信息
 */
export function clearAuth() {
  removeToken();
  removeUser();
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * 检查是否已签到
 * @returns {boolean}
 */
export function isCheckedIn() {
  const user = getUser();
  // 修复：检查正确的字段
  return user && user.checkIn?.isCheckedIn === true;
}

/**
 * 检查审核状态
 * @returns {number} -1未签到 0待审核 1已通过 2已拒绝
 */
export function getAuditStatus() {
  const user = getUser();
  return user?.checkIn?.status ?? -1;
}
