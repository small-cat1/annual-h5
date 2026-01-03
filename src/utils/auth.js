// Token 管理
import { getStorage, setStorage, removeStorage } from './storage'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * 获取 Token
 * @returns {string|null}
 */
export function getToken() {
  return getStorage(TOKEN_KEY)
}

/**
 * 设置 Token
 * @param {string} token
 */
export function setToken(token) {
  setStorage(TOKEN_KEY, token)
}

/**
 * 移除 Token
 */
export function removeToken() {
  removeStorage(TOKEN_KEY)
}

/**
 * 获取用户信息
 * @returns {object|null}
 */
export function getUser() {
  return getStorage(USER_KEY)
}

/**
 * 设置用户信息
 * @param {object} user
 */
export function setUser(user) {
  setStorage(USER_KEY, user)
}

/**
 * 移除用户信息
 */
export function removeUser() {
  removeStorage(USER_KEY)
}

/**
 * 清除登录信息
 */
export function clearAuth() {
  removeToken()
  removeUser()
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!getToken()
}

/**
 * 检查是否已报名
 * @returns {boolean}
 */
export function isRegistered() {
  const user = getUser()
  return user && user.isRegistered === 1
}

/**
 * 检查审核状态
 * @returns {number} 0待审核 1已通过 2已拒绝
 */
export function getAuditStatus() {
  const user = getUser()
  return user ? user.status : 0
}
