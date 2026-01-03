// 本地存储工具

const PREFIX = 'annual_'

/**
 * 设置存储
 * @param {string} key 键
 * @param {any} value 值
 */
export function setStorage(key, value) {
  try {
    const data = JSON.stringify(value)
    localStorage.setItem(PREFIX + key, data)
  } catch (e) {
    console.error('setStorage error:', e)
  }
}

/**
 * 获取存储
 * @param {string} key 键
 * @param {any} defaultValue 默认值
 * @returns {any}
 */
export function getStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(PREFIX + key)
    if (data === null) return defaultValue
    return JSON.parse(data)
  } catch (e) {
    console.error('getStorage error:', e)
    return defaultValue
  }
}

/**
 * 移除存储
 * @param {string} key 键
 */
export function removeStorage(key) {
  localStorage.removeItem(PREFIX + key)
}

/**
 * 清除所有存储
 */
export function clearStorage() {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * 设置会话存储
 * @param {string} key 键
 * @param {any} value 值
 */
export function setSession(key, value) {
  try {
    const data = JSON.stringify(value)
    sessionStorage.setItem(PREFIX + key, data)
  } catch (e) {
    console.error('setSession error:', e)
  }
}

/**
 * 获取会话存储
 * @param {string} key 键
 * @param {any} defaultValue 默认值
 * @returns {any}
 */
export function getSession(key, defaultValue = null) {
  try {
    const data = sessionStorage.getItem(PREFIX + key)
    if (data === null) return defaultValue
    return JSON.parse(data)
  } catch (e) {
    console.error('getSession error:', e)
    return defaultValue
  }
}

/**
 * 移除会话存储
 * @param {string} key 键
 */
export function removeSession(key) {
  sessionStorage.removeItem(PREFIX + key)
}
