// 格式化工具
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

/**
 * 格式化日期
 * @param {string|Date} date 日期
 * @param {string} format 格式
 * @returns {string}
 */
export function formatDate(date, format = "YYYY-MM-DD HH:mm:ss") {
  if (!date) return "";
  return dayjs(date).format(format);
}

/**
 * 格式化相对时间
 * @param {string|Date} date 日期
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return "";
  return dayjs(date).fromNow();
}

/**
 * 格式化倒计时
 * @param {number} seconds 秒数
 * @returns {string}
 */
export function formatCountdown(seconds) {
  if (seconds <= 0) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * 格式化手机号（隐藏中间4位）
 * @param {string} phone 手机号
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

/**
 * 格式化姓名（隐藏中间字符）
 * @param {string} name 姓名
 * @returns {string}
 */
export function formatName(name) {
  if (!name) return "";
  if (name.length === 2) {
    return name[0] + "*";
  }
  if (name.length > 2) {
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  }
  return name;
}

/**
 * 格式化数字（千分位）
 * @param {number} num 数字
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * 格式化排名
 * @param {number} rank 排名
 * @returns {string}
 */
export function formatRank(rank) {
  if (!rank || rank <= 0) return "-";
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `第${rank}名`;
}

/**
 * 格式化奖品等级
 * @param {number} level 等级
 * @returns {string}
 */
export function formatPrizeLevel(level) {
  const levels = {
    1: "特等奖",
    2: "一等奖",
    3: "二等奖",
    4: "三等奖",
    5: "参与奖",
  };
  return levels[level] || "未知";
}

/**
 * 格式化中奖方式
 * @param {number} type 类型
 * @returns {string}
 */
export function formatWinType(type) {
  const types = {
    1: "摇一摇",
    2: "随机抽奖",
    3: "弹幕抽奖",
  };
  return types[type] || "未知";
}

/**
 * 格式化领奖状态
 * @param {number} status 状态
 * @returns {string}
 */
export function formatReceiveStatus(status) {
  return status === 1 ? "已领取" : "未领取";
}

/**
 * 格式化审核状态
 * @param {number} status 状态
 * @returns {object}
 */
export function formatAuditStatus(status) {
  const statusMap = {
    0: { text: "待审核", color: "#ff9800" },
    1: { text: "已通过", color: "#4caf50" },
    2: { text: "已拒绝", color: "#f44336" },
  };
  return statusMap[status] || { text: "未知", color: "#999" };
}

const path = import.meta.env.VITE_FILE_API + "/api";
export const getUrl = (url) => {
  if (url && url.slice(0, 4) !== "http") {
    if (path === "/") {
      return url;
    }
    if (url.slice(0, 1) === "/") {
      return path + url;
    }
    return path + "/" + url;
  } else {
    return url;
  }
};
