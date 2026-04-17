import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login'] // no redirect whitelist

// 路由导航守卫
router.beforeEach(async(to, from, next) => {
  // 启动进度条
  NProgress.start()

  // 设置页面标题
  document.title = getPageTitle(to.meta.title)

  // 获取用户token
  const hasToken = getToken()
  
  // 记录访问日志
  logRouteAccess(to, from, hasToken)

  if (hasToken) {
    // 用户已登录
    await handleAuthenticatedRoute(to, from, next)
  } else {
    // 用户未登录
    await handleUnauthenticatedRoute(to, from, next)
  }
})

// 记录路由访问日志
function logRouteAccess(to, from, hasToken) {
  const timestamp = new Date().toISOString()
  const authStatus = hasToken ? 'authenticated' : 'unauthenticated'
  console.log(`[${timestamp}] Route access: ${from.path} -> ${to.path} (${authStatus})`)
}

// 处理已认证用户的路由
async function handleAuthenticatedRoute(to, from, next) {
  // 检查是否是访问登录页
  if (to.path === '/login') {
    // 已登录用户访问登录页，重定向到首页
    await redirectToHome(next)
  } else {
    // 检查用户权限和信息
    await checkUserPermission(to, from, next)
  }
}

// 重定向到首页
async function redirectToHome(next) {
  try {
    // 获取用户偏好设置
    const userPreference = await getUserHomePreference()
    
    // 根据用户偏好决定跳转页面
    let targetPath = '/'
    if (userPreference && userPreference.defaultPage) {
      targetPath = userPreference.defaultPage
    }
    
    next({ path: targetPath })
    NProgress.done()
  } catch (error) {
    console.error('Failed to get user preference:', error)
    next({ path: '/' })
    NProgress.done()
  }
}

// 获取用户首页偏好设置
async function getUserHomePreference() {
  // 模拟从store或localStorage获取用户偏好
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        defaultPage: '/dashboard',
        theme: 'light'
      })
    }, 100)
  })
}

// 检查用户权限
async function checkUserPermission(to, from, next) {
  const hasGetUserInfo = store.getters.name
  
  if (hasGetUserInfo) {
    // 已有用户信息，直接放行
    next()
  } else {
    // 需要获取用户信息
    await fetchUserInfoAndProceed(to, from, next)
  }
}

// 获取用户信息并继续
async function fetchUserInfoAndProceed(to, from, next) {
  try {
    // 显示加载提示
    console.log('Fetching user info...')
    
    // 获取用户信息
    await store.dispatch('user/getInfo')
    
    // 获取用户角色和权限
    const userRoles = await getUserRoles()
    
    // 检查路由权限
    const hasPermission = checkRoutePermission(to, userRoles)
    
    if (hasPermission) {
      // 有权限访问
      next()
    } else {
      // 无权限访问，重定向到403页面或首页
      Message.warning('You do not have permission to access this page')
      next({ path: '/' })
      NProgress.done()
    }
  } catch (error) {
    // 获取用户信息失败，需要重新登录
    handleAuthError(error, to, next)
  }
}

// 获取用户角色
async function getUserRoles() {
  // 从store获取用户角色
  const userInfo = store.state.user
  return userInfo && userInfo.roles ? userInfo.roles : ['user']
}

// 检查路由权限
function checkRoutePermission(route, roles) {
  // 如果路由没有配置roles，则允许所有已登录用户访问
  if (!route.meta || !route.meta.roles) {
    return true
  }
  
  // 检查用户角色是否在允许的角色列表中
  const requiredRoles = route.meta.roles
  return roles.some(role => requiredRoles.includes(role))
}

// 处理认证错误
async function handleAuthError(error, to, next) {
  console.error('Authentication error:', error)
  
  try {
    // 清除token
    await store.dispatch('user/resetToken')
    
    // 显示错误信息
    Message.error(error.message || 'Authentication failed, please login again.')
    
    // 重定向到登录页
    next(`/login?redirect=${to.path}`)
    NProgress.done()
  } catch (cleanupError) {
    console.error('Failed to cleanup auth state:', cleanupError)
    next(`/login`)
    NProgress.done()
  }
}

// 处理未认证用户的路由
async function handleUnauthenticatedRoute(to, from, next) {
  // 检查是否在白名单中
  if (whiteList.includes(to.path)) {
    // 白名单路由直接放行
    next()
  } else {
    // 其他路由需要登录
    await redirectToLogin(to, next)
  }
}

// 重定向到登录页
async function redirectToLogin(to, next) {
  // 保存当前路径，登录后可以跳转回来
  const redirectPath = encodeURIComponent(to.fullPath)
  
  console.log(`Redirecting to login, will return to: ${to.path}`)
  
  next(`/login?redirect=${redirectPath}`)
  NProgress.done()
}

// 路由后置守卫
router.afterEach((to, from) => {
  // 完成进度条
  NProgress.done()
  
  // 记录页面访问统计
  recordPageView(to)
})

// 记录页面访问
function recordPageView(route) {
  const pageData = {
    path: route.path,
    title: route.meta && route.meta.title,
    timestamp: new Date().toISOString()
  }
  
  // 可以发送到分析服务
  console.log('Page view:', pageData)
}

export default router
