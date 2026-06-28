/**
 * 统一响应封装
 */

/**
 * 成功响应
 */
function success(res, data, msg = 'success', code = 200) {
  return res.json({ code, msg, data });
}

/**
 * 错误响应
 */
function error(res, msg, code = 500) {
  return res.json({ code, msg, data: null });
}

/**
 * 创建响应中间件
 */
function createResponseMiddleware() {
  return (req, res, next) => {
    res.success = (data, msg) => success(res, data, msg);
    res.error = (msg, code) => error(res, msg, code);
    next();
  };
}

module.exports = {
  success,
  error,
  createResponseMiddleware
};
