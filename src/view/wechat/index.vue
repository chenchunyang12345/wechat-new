<template>
  <div class="wechat">
    <div v-if="isWXLogin" class="wechat-box">
      <!-- 左边的内容 -->
      <info-left class="info-left"></info-left>
      <wx-chat-side-bar class="wechat-box-sidebar"></wx-chat-side-bar>
      <wx-chat-list class="wechat-box-list"></wx-chat-list>
      <wx-chat-content class="wechat-box-content"></wx-chat-content>
      <!-- 右边的内容 -->
      <info-right class="info-right"></info-right>
    </div>
    <wx-login :isWXLogin="isWXLogin" @getWxLoginUserInfo="getWxLoginUserInfo" v-else></wx-login>
  </div>
</template>

<script>
import WxLogin from './children/wxLogin'
import WxChatSideBar from './children/wxChatSideBar'
import WxChatList from './children/wxChatList'
import WxChatContent from './children/wxChatContent'
// 引入左右信息框
import InfoLeft from './children/infoLeft';
import InfoRight from './children/infoRight';
import {mapGetters, mapActions} from 'vuex'
import {matchRegDbrackets} from '@/utils/regular'
import {getWxUserInfo, checkWebSync, getWebWXSync, getWxBatchGetContact} from '@/service/modules/wx'
import {turnOnRobot, getRobotAnswer} from '@/service/modules/bot'
export default {
  components: {
    WxLogin, WxChatList, WxChatContent, WxChatSideBar, InfoLeft, InfoRight
  },
  data: () => ({}),
  computed: {
    ...mapGetters(['saleBotId', 'isWXLogin', 'hasCheckLoading', 'loginWxUserInfo', 'chatUserList', 'activeIndex', 'activeUser', 'userChatLog', 'activeMessageList', 'visNodes', 'visEdges', 'graph', 'visNow', 'nextNodes', 'lastPossibleNodes'])
  },
  created () {
    // 开启全局的监听机器人
    turnOnRobot({botName: "saling_demo"})
    .then((data) => {
      console.log('已开启辅助机器人')
      this.$store.commit('SET_SALEBOTID', data.msg.id)
      // 再发送一条消息初始化状态
      getRobotAnswer(data.msg.id, {query: '初始化'})
      .then(() => {
        if(this.isWXLogin) {
          this.getWxLoginUserInfo()
        }
      })
    })
  },
  methods: {
    ...mapActions(['getWxContact']),
    // 初始化
    load (res) {
      let chatUserList = this.chatUserList
      res.forEach(el => {
        let hasItem = chatUserList.find(item => { return el.NickName === item.NickName })
        if (!hasItem && el.VerifyFlag === 0) {
          chatUserList.push(el)
        }
      })
      this.$store.commit('SET_CHATUSERLIST', chatUserList)
      // this.$store.commit('SET_ACTIVEUSER', chatUserList[0])
    },
    async getWxLoginUserInfo () {
      let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
      let urlContrnt = {
        r: ~new Date().getTime(),
        lang: 'zh_CN',
        pass_ticket: LoginInit.passTicket
      }
      let params = {
        BaseRequest: {
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          Sid: LoginInit.wxsid,
          Skey: LoginInit.skey,
          Uin: LoginInit.wxuin
        }
      }
      let res = await getWxUserInfo(urlContrnt, params)
      if (res.BaseResponse && res.BaseResponse.Ret === 1101) {
        this.$store.commit('SET_WXLOGINSTATUS', false)
        return
      }
      if (res.BaseResponse && res.BaseResponse.Ret === 0) {
        this.$store.commit('SET_LOGINWXUSERINFO', res)
        this.setLocalStorage('synckey', res.SyncKey)
        this.setLocalStorage('loginWxuserInfo', res)
        this.checkWebSync() // 启动心调检测
        await this.getWxContact()
        await this.load(res.ContactList)
        this.getWxBatchGetContact(res.ChatSet, res.ContactList)
      }
    },
    // 获取聊天会话列表
    // recentUser 最近联系人
    // recentUserList 最近联系人列表
    async getWxBatchGetContact (recentUser, recentUserList) {
      let recentUserNameList = null
      if (recentUser) {
        recentUserNameList = recentUser.split(',')
      }
      if (recentUserNameList.length > recentUserList.length) {
        recentUserNameList = recentUserNameList.slice(recentUserList.length)
        let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
        let urlContrnt = {
          type: 'ex',
          r: new Date().getTime()
        }
        let params = {
          BaseRequest: {
            DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
            Sid: LoginInit.wxsid,
            Skey: LoginInit.skey,
            Uin: LoginInit.wxuin
          },
          Count: recentUserNameList.length,
          List: recentUserNameList.map(item => { return {EncryChatRoomId: '', UserName: item} })
        }
        let res = await getWxBatchGetContact(urlContrnt, params)
        if (res.BaseResponse.Ret === 0) this.load(res.ContactList)
      }
    },
    // 心跳检测
    // window.synccheck={retcode:"0",selector:"2"}
    async checkWebSync () {
      let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
      let syncKeyList = JSON.parse(this.getLocalStorage('synckey')).List
      let newSyncKeyList = syncKeyList.map(item => {
        return item.Key + '_' + item.Val
      })
      let params = {
        lang: 'zh_CN',
        deviceid: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
        r: new Date().getTime(),
        _: new Date().getTime(),
        sid: LoginInit.wxsid,
        uin: LoginInit.wxuin,
        skey: LoginInit.skey,
        synckey: newSyncKeyList.join('|')
      }
      checkWebSync(params).then(res => {
        let retcode = matchRegDbrackets(res)[0]
        let selector = matchRegDbrackets(res)[1]
        if (retcode === '"0"') {
          switch (selector) {
            case '"0"':
              this.checkWebSync()
              break
            case '"2"':
              this.getWebWXSync()
              break
            case '"4"':
              this.getWebWXSync()
              break
            default:
              this.$store.commit('SET_WXLOGINSTATUS', false)
              break
          }
        } else {
          this.$store.commit('SET_WXLOGINSTATUS', false)
        }
      })
    },
    // 对比前后两次的graph点
    compareGraph(lastGraph, newGraph, nowvis, nextStateArr) {
      let nodeData = this.visNodes[this.activeUser.NickName];
      let edgeDate = this.visEdges[this.activeUser.NickName];
      let lastNodeIds = this.lastPossibleNodes[this.activeUser.NickName];
      // 刚进来时先删除上次保存的可能会触发的点和线
      lastNodeIds && lastNodeIds.forEach((id, idx) => {
        nodeData.remove(id);
        edgeDate.remove(id);
      })
      let renderObj = {};
      if(lastGraph === undefined) {
        lastGraph = {};
      }
      console.log(lastGraph)
      console.log(newGraph)
      console.log(nowvis)
      console.log(nextStateArr)
      if(JSON.stringify(lastGraph) !== JSON.stringify(newGraph)) {
        if(JSON.stringify(lastGraph) === JSON.stringify({})) {
            for(let v in newGraph) {
                renderObj[v] = newGraph[v];
            }
        } else {
            Object.keys(newGraph).forEach((item, idx) => {
                let hasNew = Object.keys(lastGraph).every((item2, idx2) => {
                    return item2 !== item || JSON.stringify(lastGraph[item]) !== JSON.stringify(newGraph[item]);
                })
                if(hasNew) {
                    renderObj[item] = newGraph[item];
                }
            })
        }
        // 画点和线
        console.log('render', renderObj)
        let lastNodesObj = nodeData._data;
        Object.keys(renderObj).forEach((item, idx) => {
            let noA = Object.keys(lastNodesObj).every((node) => {
              return node !== item;
            })
            let noB = Object.keys(lastNodesObj).every((node) => {
              return node !== renderObj[item][0];
            })
            // 画点
            if(noA) {
              nodeData.add({id: item, label: item, color: '#97C2FC'})
            } else {
              nodeData.update({id: item, color: '#97C2FC', font: {color: 'black'}})
            }
            if(renderObj[item][0] !== undefined) {  // 可能有向图某个值为空数组
              if(noB) {
                nodeData.add({id: renderObj[item][0], label: renderObj[item][0], color: '#97C2FC'})
              } else {
                nodeData.update({id: renderObj[item][0], color: '#97C2FC', font: {color: 'black'}})
              }
            }
            let hasLine = nodeData.get({
              filter: function(node) {
                return node.id === item+'to'+renderObj[item][0];
              }
            })
            if(hasLine.length === 0) {
              // 画线
              this.visEdges[this.activeUser.NickName].add({id: item+'to'+renderObj[item][0], from: item, to: renderObj[item][0]})
            }
        })
      }
      // }
      let idArr = []; // 用来保存下次更新时要删除的点和线
      // 更新颜色状态（当前选中的）
      let nowNode = nodeData.get({
        filter: function(item) {
          return item.id === nowvis;
        }
      })
      if(nowNode.length === 0 && nowvis !== null) {
        nodeData.add({id: nowvis, label: nowvis, color: '#6387FF', font: {color: '#fff'}});
        idArr.push(nowvis)
      } else {
        nowNode.length && nodeData.update({...nowNode[0], color: '#6387FF', font: {color: '#fff'}})
      }
      // 画出下一个状态可能的点， 并以虚线连接
      nextStateArr.forEach((nextItem, idx) => {
        // 点
        nodeData.add({id: nextItem, label: nextItem, color: '#eee'});
        idArr.push(nextItem)
        if(nowvis) {
          // 线
          edgeDate.add({id: nowvis+'to'+nextItem, from: nowvis, to: nextItem, dashes: true});
          idArr.push(nowvis+'to'+nextItem);
        }
      })
      this.$store.commit('SET_LASTPOSSIBLENODES', {lastArr: idArr, name: this.activeUser.NickName })
    },
    // 获取微信新消息
    async getWebWXSync () {
      let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
      let syncKey = JSON.parse(this.getLocalStorage('synckey'))
      let urlContrnt = {
        sid: LoginInit.wxsid,
        lang: 'zh_CN',
        skey: LoginInit.skey,
        pass_ticket: LoginInit.passTicket
      }
      let params = {
        BaseRequest: {
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          Sid: LoginInit.wxsid,
          Skey: LoginInit.skey,
          Uin: LoginInit.wxuin
        },
        SyncKey: syncKey
      }
      let res = await getWebWXSync(urlContrnt, params)
      this.setLocalStorage('synckey', res.SyncCheckKey)
      if (res.AddMsgCount) {
        let wxContactList = JSON.parse(this.getLocalStorage('wxContact'))
        res.AddMsgList.forEach(item => {
          if (item.Content || item.MsgType === 47) {
            let chatUserList = this.chatUserList
            let hasNewUserInfo = null
            let hasUser = null
            if (item.FromUserName === this.loginWxUserInfo.User.UserName) {
              // 接受到自己微信信息
              hasNewUserInfo = wxContactList.find(el => {
                return el.UserName === item.ToUserName
              })
              hasUser = chatUserList.findIndex(el => {
                return el.UserName === item.ToUserName
              })
            } else {
              // 接受到别人微信信息
              hasNewUserInfo = wxContactList.find(el => {
                return el.UserName === item.FromUserName
              })
              hasUser = chatUserList.findIndex(el => {
                return el.UserName === item.FromUserName
              })
            }
            // ------
            // 如果发信息过来的人和当前所在的聊天框是同一个人
            if(this.activeUser.UserName === item.FromUserName) {
              getRobotAnswer(this.saleBotId, {query: 'CQ' + item.Content})
                .then((data) => {
                  let lastGraph = this.graph[this.activeUser.NickName];
                  let ins = data.msg.instructions;
                  let userProfile = ins[0].params;
                  let graph = ins[1].params;
                  let curState = ins[2].params;
                  let nextState = ins[3].params;
                  let insurance = ins[4].params;  // 保险详细信息
                  let todoList = ins[5].params;   // 待办事项
                  let schedule = ins[6].params;   // 时间地点
                  let recommendation = ins[7].params;
                  this.$store.commit('SET_LEFTTOPINFO', userProfile.items)
                  this.$store.commit('SET_LEFTBOTTOMINFO', insurance.items)
                  this.$store.commit('SET_RIGHTBOTTOMINFO_TODO', todoList.items)
                  this.$store.commit('SET_RIGHTBOTTOMINFO_DATE', schedule.items)
                  let newGraph = graph.adjoin;
                  let nowvis = curState.curState;
                  let nextStateArr = nextState.nextState;
                  // this.$store.commit('SET_VISNOW', {name: this.activeUser.NickName, nowvis: nowvis})
                  // this.$store.commit('SET_NEXTNODES', {nextStateArr, name: this.activeUser.NickName})
                  this.$store.commit('SET_GRAPH', {newGraph: newGraph, name: this.activeUser.NickName})
                  this.compareGraph(lastGraph, newGraph, nowvis, nextStateArr)    // 对比增加点线
                })
            }
            // ------
            if (hasNewUserInfo) {
              let activeIndex = this.activeIndex
              let userChatLog = this.userChatLog
              let activeMessageList = this.activeMessageList
              if (hasUser !== -1) {
                chatUserList.splice(hasUser, 1)
                if (activeIndex < hasUser) activeIndex += 1 // 有新信息用户置前，高亮节点下移
              } else {
                // 非用户列表用户，选中节点下移
                activeIndex += 1
              }
              if (this.activeUser.UserName === hasNewUserInfo.UserName) {
                activeIndex = 0 // 处于选中状态用户提前高亮
              } else {
                hasNewUserInfo.hadRead = false
              }
              chatUserList.unshift(hasNewUserInfo)
              chatUserList[0].newChat = item.Content
              if (!item.Content && item.MsgType === 47) chatUserList[0].newChat = '[收到了一个表情，请在手机上查看]' // 非系统内置表情
              if (item.MsgType === 10002) chatUserList[0].newChat = '[撤回一条信息]' // 信息被撤回处理
              if (item.MsgType === 49) chatUserList[0].newChat = '[文件]' // 收到文件
              chatUserList[0].time = this.setDateFormat(new Date(), 0, 'hh:mm')
              this.$store.commit('SET_CHATUSERLIST', chatUserList)
              this.$store.commit('SET_ACTIVEINDEX', activeIndex)
              if (!userChatLog[hasNewUserInfo.UserName]) userChatLog[hasNewUserInfo.UserName] = []
              if (item.MsgType === 10002) {
                // 信息被撤回，不入库处理
                const matchREG = /&lt;msgid&gt;(.+?)&lt;\/msgid/
                let msgid = null
                if (item.Content.match(matchREG)[1]) msgid = item.Content.match(matchREG)[1]
                userChatLog[hasNewUserInfo.UserName] = userChatLog[hasNewUserInfo.UserName].map(el => {
                  if (el.MsgId === msgid) el.recall = true
                  return el
                })
              } else {
                userChatLog[hasNewUserInfo.UserName].push(item)
              }
              this.$store.commit('SET_USERCHATLOG', userChatLog)
              if (this.activeUser.UserName === hasNewUserInfo.UserName) {
                activeMessageList = this.userChatLog[this.activeUser.UserName] ? this.userChatLog[this.activeUser.UserName] : []
                this.$store.commit('SET_ACTIVEMESSAGELIST', activeMessageList) // 更新高亮对话
              }
            }
          }
        })
      }
      this.checkWebSync()
    }
  }
}
</script>

<style lang="scss" scoped>
.wechat {
  &-box {
    display: flex;
    background: #fff;
    &-sidebar {
      flex: 0 0 60px;
      // height: 648px;
      height: 878px;
    }
    &-list {
      flex: 0 0 240px;
      background-color: #303134;
      border: 1px #ccc solid;
    }
    &-content {
      flex: 0 0 500px;
      border: 1px solid #ccc;
      border-left: none;
    }
  }
}

// 左右信息框的尺寸
.info-left {
  color: black;
  flex: 1;
}
.info-right {
  color: black;
  flex: 1;
}
</style>
