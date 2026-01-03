// 用户相关接口
import { post, get, put } from '@/utils/request'

/**
 * 获取当前用户信息
 * @returns {Promise}
 */
export function getUserInfo() {
  return get('/h5/user/info')
}

/**
 * 用户报名
 * @param {object} data { realName, phone, department, employeeNo }
 * @returns {Promise}
 */
export function register(data) {
  return post('/h5/user/register', data)
}

/**
 * 更新用户信息
 * @param {object} data { realName, phone, department, employeeNo }
 * @returns {Promise}
 */
export function updateUserInfo(data) {
  return put('/h5/user/info', data)
}

/**
 * 获取审核状态
 * @returns {Promise}
 */
export function getAuditStatus() {
  return get('/h5/user/audit')
}
