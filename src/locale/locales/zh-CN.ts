/**
 * 简体中文语言包
 *
 * 命名规范：模块.子模块.key，全部小驼峰
 * 新增文案时请同步在 en-US.ts 补充对应 key
 */
export default {
  common: {
    loading: '加载中...',
    confirm: '确定',
    cancel: '取消',
    back: '返回',
  },

  lang: {
    switch: '切换语言',
  },

  captcha: {
    title: '请完成安全验证',
  },

  login: {
    title: '选择登录方式',
    subtitle: '请选择您喜欢的登录方式',
    anonymous: {
      title: '确认登录（默认匿名登录）',
      desc: '无需注册，快速体验',
    },
    openid: {
      title: '微信小程序 openId 静默登录',
      desc: '使用微信 OpenID 静默登录',
    },
    phoneAuth: {
      title: '微信小程序手机号授权登录',
      desc: '推荐未注册用户使用',
    },
    phone: {
      title: '手机验证码登录',
      desc: '使用手机号获取验证码登录',
    },
    password: {
      title: '密码登录',
      desc: '使用手机号/邮箱/用户名 + 密码登录',
    },
    email: {
      title: '邮箱验证码登录',
      desc: '使用邮箱获取验证码登录',
    },
    footer: {
      prefix: '选择登录方式即表示您同意我们的',
      terms: '服务条款',
      and: '和',
      privacy: '隐私政策',
    },
    toast: {
      loading: '登录中...',
      loggingIn: '正在登录...',
      success: '登录成功',
      fail: '登录失败',
      retry: '登录失败，请重试',
      phoneFail: '获取手机号失败',
    },
  },

  pick: {
    subtitle:
      '12 个人，12 段故事 · 史诗 / 商战 / 暧昧 / 青春 / 友情 / 亲情 / 职场 / 日常 · 选一位，走进 TA 的开场',
    maleLine: '男生线',
    maleTip: '高富帅 / 竹马 / 精英',
    femaleLine: '女生线',
    femaleTip: '大女主 / 萌妹 / 御姐',
    foot: {
      ai: 'AI Agent文字游戏：选一张卡→ 开始你们的故事',
      by: 'By：小夏-云开发CloudBase构建',
    },
    toast: {
      loadFail: '角色加载失败',
    },
  },

  // TODO: 继续补充其它页面（opening / play / gender / ending / report / stats / profile / demo / index）文案
}
