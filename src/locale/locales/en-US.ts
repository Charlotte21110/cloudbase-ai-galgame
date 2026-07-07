/**
 * English language pack
 *
 * Keep keys in sync with zh-CN.ts. Items marked TODO need translation.
 */
export default {
  common: {
    loading: 'Loading...',
    confirm: 'OK',
    cancel: 'Cancel',
    back: 'Back',
  },

  lang: {
    switch: 'Switch Language',
  },

  captcha: {
    title: 'Please complete the security check',
  },

  login: {
    title: 'Choose a sign-in method',
    subtitle: 'Select your preferred way to sign in',
    anonymous: {
      title: 'Continue (anonymous by default)',
      desc: 'No registration, quick start',
    },
    openid: {
      title: 'WeChat Mini Program OpenID silent login',
      desc: 'Sign in silently with WeChat OpenID',
    },
    phoneAuth: {
      title: 'WeChat Mini Program phone number login',
      desc: 'Recommended for new users',
    },
    phone: {
      title: 'Phone verification code login',
      desc: 'Sign in with a phone verification code',
    },
    password: {
      title: 'Password login',
      desc: 'Sign in with phone / email / username + password',
    },
    email: {
      title: 'Email verification code login',
      desc: 'Sign in with an email verification code',
    },
    footer: {
      prefix: 'By choosing a sign-in method you agree to our',
      terms: 'Terms of Service',
      and: 'and',
      privacy: 'Privacy Policy',
    },
    toast: {
      loading: 'Signing in...',
      loggingIn: 'Signing in...',
      success: 'Signed in',
      fail: 'Sign-in failed',
      retry: 'Sign-in failed, please try again',
      phoneFail: 'Failed to get phone number',
    },
  },

  pick: {
    subtitle:
      '12 people, 12 stories · Epic / Business / Romance / Youth / Friendship / Family / Career / Daily · Pick one, step into their opening',
    maleLine: 'Male Route',
    maleTip: 'Elite / Childhood friend / Professional',
    femaleLine: 'Female Route',
    femaleTip: 'Heroine / Cute girl / Mature lady',
    foot: {
      ai: 'AI Agent text game: pick a card → start your story',
      by: 'By Xiaoxia — Built with CloudBase',
    },
    toast: {
      loadFail: 'Failed to load character',
    },
  },

  // TODO: translate the remaining pages (opening / play / gender / ending / report / stats / profile / demo / index)
}
