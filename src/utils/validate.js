// 验证规则

/**
 * 验证手机号
 * @param {string} phone 手机号
 * @returns {boolean}
 */
export function isPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证邮箱
 * @param {string} email 邮箱
 * @returns {boolean}
 */
export function isEmail(email) {
  return /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(email)
}

/**
 * 验证身份证号
 * @param {string} idCard 身份证号
 * @returns {boolean}
 */
export function isIdCard(idCard) {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)
}

/**
 * 验证工号
 * @param {string} employeeNo 工号
 * @returns {boolean}
 */
export function isEmployeeNo(employeeNo) {
  return /^[A-Za-z0-9]{4,20}$/.test(employeeNo)
}

/**
 * 验证姓名（中文）
 * @param {string} name 姓名
 * @returns {boolean}
 */
export function isChineseName(name) {
  return /^[\u4e00-\u9fa5]{2,10}$/.test(name)
}

/**
 * 验证URL
 * @param {string} url URL
 * @returns {boolean}
 */
export function isUrl(url) {
  return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(url)
}

/**
 * 验证是否为空
 * @param {any} value 值
 * @returns {boolean}
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 验证长度范围
 * @param {string} value 值
 * @param {number} min 最小长度
 * @param {number} max 最大长度
 * @returns {boolean}
 */
export function isLengthBetween(value, min, max) {
  const len = value ? value.length : 0
  return len >= min && len <= max
}

/**
 * 创建表单验证器
 * @param {object} rules 验证规则
 * @returns {function}
 */
export function createValidator(rules) {
  return (data) => {
    const errors = {}
    
    for (const field in rules) {
      const fieldRules = rules[field]
      const value = data[field]
      
      for (const rule of fieldRules) {
        // 必填验证
        if (rule.required && isEmpty(value)) {
          errors[field] = rule.message || `${field}不能为空`
          break
        }
        
        // 长度验证
        if (rule.min !== undefined || rule.max !== undefined) {
          const len = value ? value.length : 0
          if (rule.min !== undefined && len < rule.min) {
            errors[field] = rule.message || `${field}长度不能小于${rule.min}`
            break
          }
          if (rule.max !== undefined && len > rule.max) {
            errors[field] = rule.message || `${field}长度不能大于${rule.max}`
            break
          }
        }
        
        // 正则验证
        if (rule.pattern && !rule.pattern.test(value)) {
          errors[field] = rule.message || `${field}格式不正确`
          break
        }
        
        // 自定义验证
        if (rule.validator && !rule.validator(value, data)) {
          errors[field] = rule.message || `${field}验证失败`
          break
        }
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }
}

/**
 * 报名表单验证规则
 */
export const registerRules = {
  realName: [
    { required: true, message: '请输入真实姓名' },
    { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '姓名格式不正确' }
  ],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  department: [
    { required: true, message: '请选择部门' }
  ],
  employeeNo: [
    { required: true, message: '请输入工号' },
    { pattern: /^[A-Za-z0-9]{4,20}$/, message: '工号格式不正确' }
  ]
}

/**
 * 弹幕内容验证规则
 */
export const danmakuRules = {
  content: [
    { required: true, message: '请输入弹幕内容' },
    { min: 1, max: 50, message: '弹幕内容长度1-50个字符' }
  ]
}
