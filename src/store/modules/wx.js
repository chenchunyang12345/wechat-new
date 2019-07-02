import {getWxContact, setWxMsgStatus} from '@/service/modules/wx'
import * as types from '../mutation-types'
import {getLocalStorage, setLocalStorage} from '@/utils/utils'
const state = {
  userInfo: JSON.parse(getLocalStorage('userInfo')),
  selectSideMenu: 1, // 侧边功能按钮
  isWXLogin: JSON.parse(getLocalStorage('isWXLogin')), // 用户微信登陆状态
  hasCheckLoading: 0, // 心跳是否正常
  loginWxUserInfo: JSON.parse(getLocalStorage('loginWxuserInfo')), // 微信用户信息
  wxUserTab: [], // 用户标签
  chatLogShow: false,
  redirectUriType: JSON.parse(getLocalStorage('redirectUriType')), // 重定向地址
  synckey: {},
  chatRecordList: [], // 聊天记录
  userMemberList: [], // 微信用户通讯录列表
  addressBookIndex: {}, // 微信用户通讯录索引
  chatUserList: [], // 侧边栏聊天客户
  activeUser: {
    HeadImgUrl: '/static/images/logo.png'
  }, // 高亮用户
  activeIndex: -1, // 聊天高亮节点
  activeMessageList: [], // 当前聊天用户聊天记录
  userChatLog: {}, // 用户聊天记录列表
  startCheckWebSync: 0, // 启动微信心跳
  hasWxUserList: {},
  // ------增加内容--------
  leftTopInfo: [],
  leftBottomInfo: [],
  rightTopInfo: '',
  rightBottomInfo_todo: [],
  rightBottomInfo_date: {},
  saleBotId: 0,   // 销售机器人id
  crmUserId: 0,   // crm登录后的id
  visNodes: {},
  visEdges: {},
  visNow: {},
  updateIndex: 2,  // 1为只add，2为重新更新
  graph: {},
  nextNodes: {},
  lastPossibleNodes: {},    // 上一次渲染时可能出现的点
}

const getters = {
  userInfo: state => state.userInfo,
  selectSideMenu: state => state.selectSideMenu,
  hasWxUserList: state => state.hasWxUserList,
  isWXLogin: state => state.isWXLogin,
  hasCheckLoading: state => state.hasCheckLoading,
  loginWxUserInfo: state => state.loginWxUserInfo,
  wxUserTab: state => state.wxUserTab,
  chatLogShow: state => state.chatLogShow,
  redirectUriType: state => state.redirectUriType,
  synckey: state => state.synckey,
  chatRecordList: state => state.chatRecordList,
  userMemberList: state => state.userMemberList,
  addressBookIndex: state => state.addressBookIndex,
  chatUserList: state => state.chatUserList,
  activeUser: state => state.activeUser,
  activeIndex: state => state.activeIndex,
  activeMessageList: state => state.activeMessageList,
  userChatLog: state => state.userChatLog,
  startCheckWebSync: state => state.startCheckWebSync,
  // ------增加内容---------
  leftTopInfo: state => state.leftTopInfo,
  leftBottomInfo: state => state.leftBottomInfo,
  rightTopInfo: state => state.rightTopInfo,
  rightBottomInfo_todo: state => state.rightBottomInfo_todo,
  rightBottomInfo_date: state => state.rightBottomInfo_date,
  saleBotId: state => state.saleBotId,
  crmUserId: state => state.crmUserId,
  visNodes: state => state.visNodes,
  visEdges: state => state.visEdges,
  visNow: state => state.visNow,
  updateIndex: state => state.updateIndex,
  graph: state => state.graph,
  nextNodes: state => state.nextNodes,
  lastPossibleNodes: state => state.lastPossibleNodes,
}

const actions = {
  // 获取微信通讯录
  async getWxContact ({commit}, param) {
    let LoginInit = JSON.parse(getLocalStorage('loginInit'))
    let params = {
      lang: 'zh_CN',
      pass_ticket: LoginInit.passTicket,
      r: new Date().getTime(),
      seq: 0,
      skey: LoginInit.skey
    }
    let res = await getWxContact(params)
    commit(types.SET_USERMEMBERLIST, res.MemberList)
  },
  // 标记已读
  async setWxMsgStatus ({commit}, param) {
    let LoginInit = JSON.parse(getLocalStorage('loginInit'))
    let params = {
      BaseRequest: {
        DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
        Sid: LoginInit.wxsid,
        Skey: LoginInit.skey,
        Uin: LoginInit.wxuin
      },
      Code: 1,
      FromUserName: state.loginWxUserInfo.User.UserName,
      ToUserName: state.activeUser.UserName,
      ClientMsgId: new Date().getTime()
    }
    await setWxMsgStatus(params)
  }
}

const mutations = {
  [types.SET_SELECTSIDEMENU] (state, data) {
    state.selectSideMenu = data
  },
  [types.SET_USERCHATLOG] (state, data) {
    state.userChatLog = data
  },
  [types.SET_UPDATEHASWXUSERLIST] (state, data) {
    state.userMemberList.forEach(el => {
      if (state.hasWxUserList[el.NickName]) {
        el.isSync = 1
      } else {
        el.isSync = 0
      }
    })
  },
  [types.GET_HASWXUSERLIST] (state, data) {
    data.forEach(e => {
      state.hasWxUserList[e.nickName] = e
    })
  },
  [types.GET_WXUSERTAB] (state, data) {
    state.wxUserTab = data
  },
  [types.SET_WXLOGINSTATUS] (state, data) {
    state.isWXLogin = data
    setLocalStorage('isWXLogin', data)
  },
  [types.SET_HASCHECKLOADING] (state, data) {
    state.hasCheckLoading = data
  },
  [types.SET_CHATLOGSHOW] (state, data) {
    state.chatLogShow = data
  },
  [types.SET_REDIRECTURITYPE] (state, data) {
    setLocalStorage('redirectUriType', data)
    state.redirectUriType = data
  },
  [types.SET_SYNCKEY] (state, data) {
    state.synckey = data
  },
  [types.GET_CHATRECORDS] (state, data) {
    if (data.current > 1) {
      state.chatRecordList.records.push(...data.records)
      state.chatRecordList.current = data.current
    } else {
      state.chatRecordList = data
    }
  },
  [types.SET_USERMEMBERLIST] (state, data) {
    let userMemberList = []
    data.forEach((el, index) => {
      if (el.VerifyFlag === 0) {
        if (el.StarFriend) {
          userMemberList.unshift(el)
        } else {
          userMemberList.push(el)
        }
      }
    })
    state.userMemberList = userMemberList
    userMemberList.forEach((e, index) => {
      state.addressBookIndex[e.NickName] = index
    })
    setLocalStorage('wxContact', userMemberList)
  },
  [types.SET_CHATUSERLIST] (state, data) {
    state.chatUserList = data
  },
  [types.SET_ACTIVEUSER] (state, data) {
    state.activeUser = data
  },
  [types.SET_ACTIVEINDEX] (state, data) {
    state.activeIndex = data
  },
  [types.SET_ACTIVEINDEX] (state, data) {
    state.activeIndex = data
  },
  [types.SET_ACTIVEMESSAGELIST] (state, data) {
    state.activeMessageList = data
  },
  [types.SET_LOGINWXUSERINFO] (state, data) {
    state.loginWxUserInfo = data
  },
  [types.START_CHECKWEBSYNC] (state, data) {
    state.startCheckWebSync = data
  },
  // 增加——————————————————————————
  [types.SET_SALEBOTID] (state, data) {
    state.saleBotId = data
  },
  [types.SET_CRMUSERID] (state, data) {
    state.crmUserId = data
  },
  [types.SET_LEFTTOPINFO] (state, data) {
    state.leftTopInfo = data
  },
  [types.SET_LEFTBOTTOMINFO] (state, data) {
    state.leftBottomInfo = data
  },
  [types.SET_RIGHTBOTTOMINFO_TODO] (state, data) {
    state.rightBottomInfo_todo = data
  },
  [types.SET_RIGHTBOTTOMINFO_DATE] (state, data) {
    state.rightBottomInfo_date = data
  },
  [types.SET_VISNOW] (state, data) {
    let { name, nowvis } = data; 
    state.visNow[name] = nowvis
  },
  [types.SET_VISNODES] (state, data) {
    console.log(data)
    let { name, nodes } = data
    state.visNodes[name] = nodes
  },
  [types.UPDATE_VISNODES] (state, data) {
    console.log(data)
    let { name } = data;
  },
  [types.SET_VISEDGES] (state, data) {
    console.log(data)
    let { name, edges } = data
    state.visEdges[name] = edges
  },
  [types.SET_UPDATEINDEX] (state, data) {
    state.updateIndex = data
  },
  [types.SET_GRAPH] (state, data) {
    let { newGraph, name } = data;
    state.graph[name] = newGraph
  },
  [types.SET_NEXTNODES] (state, data) {
    let { nextStateArr, name } = data;
    state.nextNodes[name] = nextStateArr
  },
  [types.SET_LASTPOSSIBLENODES] (state, data) {
    let { name, lastArr } = data
    state.lastPossibleNodes[name] = lastArr
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
