/* 微信信息发送模块
 * YJ
 * 2018-08-08
*/
<template>
   <div class="chat-session-body-ft">
    <!-- <div class="emoji-box" v-show="emojiBoxShow">
      <v-tabs v-model="activeEmoji" color="grey darken-3" dark slider-color="white">
        <v-tab key="qqemoji" ripple>qq表情</v-tab>
        <v-tab key="fhemoji" ripple>符号表情</v-tab>
        <v-tab-item key="qqemoji">
          <div class="qq-face">
            <a v-for="(item, key) in QQFaceListData" :title="item.name" :key="key" :class="['face', 'qqface'+item.id]" @click="selsectEmoji(item.name)"></a>
          </div>
        </v-tab-item>
        <v-tab-item key="fhemoji" style="background: #3a3a3a;">
          <div style="overflow-y: auto;height: 222px;overflow-x: hidden;">
            <div class="emoji-face">
              <a v-for="(item, key) in fhEmojoList" :title="item.name" :key="key" :class="['face', 'emoji'+key]" @click="selsectfhEmoji(item)"></a>
            </div>
          </div>
        </v-tab-item>
      </v-tabs>
    </div>
    <div class="topBar">
      <v-btn flat icon small :color="emojiBoxShow?'pink':'grey darken-2'" @click="emojiBoxShow = !emojiBoxShow">
        <v-icon>face</v-icon>
      </v-btn>
      <el-upload
        style="display: inline-block;"
        ref="upload"
        action="/upload/cgi-bin/mmwebwx-bin/webwxuploadmedia?f=json"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        multiple
        :with-credentials="true"
        :file-list="fileList">
        <v-btn flat icon small color="grey darken-2">
          <v-icon>unarchive</v-icon>
        </v-btn>
      </el-upload>
      <v-btn flat icon small color="grey darken-2">
        <v-icon>camera_alt</v-icon>
      </v-btn>
      <v-btn flat icon small color="grey darken-2">
        <v-icon>track_changes</v-icon>
      </v-btn>
    </div> -->
    <div class="my-message">
      <v-textarea v-model="message" rows="7" no-resize persistent-hint solo @keyup.ctrl.enter.native="sendMessage" @click="emojiBoxShow = false"></v-textarea>
      <div class="send-btn">
        <v-btn flat icon color="#5584ff" @click="sendMessage"><v-icon>send</v-icon></v-btn>
      </div>
    </div>
   </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'
import {sendWxMsg, uploadMedia, sendMsgImg} from '@/service/modules/wx'
import {QQFaceList, QQFaceMap, EmojiList, EmojiCodeMap} from '@/utils/dict'
import {getRobotAnswer} from '@/service/modules/bot'
export default {
  components: {
  },
  data: () => ({
    message: '',
    activeEmoji: 'qqemoji',
    emojiBoxShow: false,
    fileList: []
  }),
  computed: {
    ...mapGetters(['saleBotId', 'loginWxUserInfo', 'activeUser', 'userChatLog', 'chatUserList', 'activeMessageList', 'activeIndex', 'graph', 'visNodes', 'visEdges', 'visNow', 'nextNodes', 'lastPossibleNodes']),
    QQFaceListData () {
      return QQFaceList.map(el => {
        return {name: el, id: QQFaceMap[el]}
      })
    },
    fhEmojoList () {
      return EmojiList.map(el => {
        return {name: el, id: QQFaceMap[`[${el}]`]}
      })
    }
  },
  methods: {
    ...mapActions(['getWxUserInfo', 'updateWxUserMember']),
    // 对比两次的graph
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
    // 发送信息
    async sendMessage () {
      this.emojiBoxShow = false
      if (this.message) {
        let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
        let urlContrnt = {
          lang: 'zh_CN',
          pass_ticket: LoginInit.passTicket
        }
        let ClientMsgId = new Date().getTime()
        let params = {
          BaseRequest: {
            DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
            Sid: LoginInit.wxsid,
            Skey: LoginInit.skey,
            Uin: LoginInit.wxuin
          },
          Msg: {
            ClientMsgId: ClientMsgId,
            Content: this.message,
            FromUserName: this.loginWxUserInfo.User.UserName,
            LocalID: ClientMsgId,
            ToUserName: this.activeUser.UserName,
            Type: 1
          },
          Scene: 0
        }
        let res = await sendWxMsg(urlContrnt, params)
        if (res.BaseResponse.Ret === 0) {
          // 发送完消息发生的事件
          // let botRes = await getRobotAnswer(this.saleBotId, { query: 'SQ' + this.message })
          // console.log(botRes)
          // let lastGraph = this.graph[this.activeUser.NickName];
          // let ins = botRes.msg.instructions;
          // let userProfile = ins[0].params;
          // let graph = ins[1].params;
          // let curState = ins[2].params;
          // let nextState = ins[3].params;
          // let insurance = ins[4].params;  // 保险详细信息
          // let todoList = ins[5].params;   // 待办事项
          // let schedule = ins[6].params;   // 时间地点
          // let recommendation = ins[7].params;
          // this.$store.commit('SET_LEFTTOPINFO', userProfile.items)
          // this.$store.commit('SET_LEFTBOTTOMINFO', insurance.items)
          // this.$store.commit('SET_RIGHTBOTTOMINFO_TODO', todoList.items)
          // this.$store.commit('SET_RIGHTBOTTOMINFO_DATE', schedule.items)
          // let newGraph = graph.adjoin;
          // let nowvis = curState.curState;
          // let nextStateArr = nextState.nextState;
          // // this.$store.commit('SET_VISNOW', {name: this.activeUser.NickName, nowvis: nowvis})
          // // this.$store.commit('SET_NEXTNODES', {nextStateArr, name: this.activeUser.NickName})
          // this.$store.commit('SET_GRAPH', {newGraph: newGraph, name: this.activeUser.NickName})
          // this.compareGraph(lastGraph, newGraph, nowvis, nextStateArr)    // 对比增加点线
          getRobotAnswer(this.saleBotId, { query: 'SQ' + this.message })
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
              this.$store.commit('SET_VISNOW', {name: this.activeUser.NickName, nowvis: nowvis})
              this.$store.commit('SET_NEXTNODES', {nextStateArr, name: this.activeUser.NickName})
              this.$store.commit('SET_GRAPH', {newGraph: newGraph, name: this.activeUser.NickName})
              this.compareGraph(lastGraph, newGraph, nowvis, nextStateArr)    // 对比增加点线
            })
          let userChatLog = this.userChatLog
          let chatUserList = this.chatUserList
          let activeMessageList = this.activeMessageList
          let newMes = Object.assign(params.Msg, {MsgType: 1})
          if (!userChatLog[this.activeUser.UserName]) userChatLog[this.activeUser.UserName] = []
          userChatLog[this.activeUser.UserName].push(newMes)
          activeMessageList = userChatLog[this.activeUser.UserName] ? userChatLog[this.activeUser.UserName] : []
          this.$store.commit('SET_ACTIVEMESSAGELIST', activeMessageList)
          this.$store.commit('SET_USERCHATLOG', userChatLog)
          chatUserList[this.activeIndex].newChat = this.message
          chatUserList[this.activeIndex].time = this.setDateFormat(new Date(), 0, 'hh:mm')
          this.$store.commit('SET_CHATUSERLIST', chatUserList)
          this.message = null
        }
      }
    },
    // 选择qq表情
    selsectEmoji (el) {
      if (!this.message) this.message = ''
      this.message += `[${el}]`
    },
    // 选择符号表情
    selsectfhEmoji (el) {
      if (!this.message) this.message = ''
      // 将表情插入文本中，并另存一份非编译表情文本
      this.message += EmojiCodeMap[el.id]
    },
    // 附件上传前出处理
    handleBeforeUpload (file) {
      let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
      let ext, mediatype
      ext = file.name.match(/.*\.(.*)/)
      if (ext) {
        ext = ext[1].toLowerCase()
      } else {
        ext = ''
      }
      switch (ext) {
        case 'bmp':
        case 'jpeg':
        case 'jpg':
        case 'png':
          mediatype = 'pic'
          break
        case 'mp4':
          mediatype = 'video'
          break
        default:
          mediatype = 'doc'
      }
      let uploadMediaRequest = JSON.stringify({
        BaseRequest: {
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          Sid: LoginInit.wxsid,
          Skey: LoginInit.skey,
          Uin: LoginInit.wxuin
        },
        ClientMediaId: (Date.now() + Math.random().toFixed(3)).replace('.', ''),
        TotalLen: file.size,
        StartPos: 0,
        DataLen: file.size,
        MediaType: 4,
        UploadType: 2,
        FromUserName: this.loginWxUserInfo.User.UserName,
        ToUserName: this.activeUser.UserName
      })
      let data = file
      let form = new FormData()
      form.append('name', file.name)
      form.append('type', file.type)
      form.append('lastModifiedDate', new Date().toGMTString())
      form.append('size', file.size)
      form.append('mediatype', mediatype)
      form.append('uploadmediarequest', uploadMediaRequest)
      form.append('webwx_data_ticket', this.getCookie('webwx_data_ticket'))
      form.append('pass_ticket', LoginInit.passTicket)
      form.append('filename', data, {
        filename: file.name,
        contentType: file.type,
        knownLength: file.size
      })
      this.uploadMedia(form).then(res => {
        switch (mediatype) {
          case 'pic':
            this.sendMsgImg(res, JSON.parse(uploadMediaRequest).ClientMediaId)
            break
          case 'doc':
            // this.sendDoc(file, ext, res)
            break
          case 'video':
            break
        }
      })
      return false
    },
    async uploadMedia (params) {
      let res = await uploadMedia(params)
      return res
    },
    // 发送图片
    async sendMsgImg (data, clientMediaId) {
      let LoginInit = JSON.parse(this.getLocalStorage('loginInit'))
      let parmas = {
        BaseRequest: {
          DeviceID: 'e' + ('' + Math.random().toFixed(15)).substring(2, 17),
          Sid: LoginInit.wxsid,
          Skey: LoginInit.skey,
          Uin: LoginInit.wxuin
        },
        Msg: {
          ClientMediaId: (Date.now() + Math.random().toFixed(3)).replace('.', ''),
          Content: '',
          FromUserName: this.loginWxUserInfo.User.UserName,
          ToUserName: this.activeUser.UserName,
          LocalID: clientMediaId,
          MediaId: data.MediaId,
          Type: 3
        },
        Scene: 0
      }
      let res = await sendMsgImg(parmas)
      if (res.BaseResponse.Ret === 0) {
        let userChatLog = this.userChatLog
        let chatUserList = this.chatUserList
        let activeMessageList = this.activeMessageList
        if (!userChatLog[this.activeUser.UserName]) userChatLog[this.activeUser.UserName] = []
        userChatLog[this.activeUser.UserName].push({
          Content: '',
          FromUserName: this.loginWxUserInfo.User.UserName,
          ToUserName: this.activeUser.UserName,
          MsgId: res.MsgID,
          MsgType: 3,
          Status: 3
        })
        activeMessageList = userChatLog[this.activeUser.UserName] ? userChatLog[this.activeUser.UserName] : []
        this.$store.commit('SET_ACTIVEMESSAGELIST', activeMessageList)
        this.$store.commit('SET_USERCHATLOG', userChatLog)
        chatUserList[this.activeIndex].newChat = '[图片]'
        chatUserList[this.activeIndex].time = this.setDateFormat(new Date(), 0, 'hh:mm')
        this.$store.commit('SET_CHATUSERLIST', chatUserList)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-session-body-ft {
  .emoji-box {
    position: absolute;
    left: 0;
    top: -270px;
    height: 270px;
    box-shadow: 5px -5px 6px 0px #1e1e1e;
  }
  .topBar {
    height: 40px;
    padding: 0 17px;
  }
  .my-message {
    .send-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      color: #616161;
    }
  }
}
// 重置vuetify样式
.v-btn--icon.v-btn--small {
  height: 25px;
  width: 25px;
}
</style>
<style lang="scss">
.theme--light .v-text-field--solo .v-input__slot {
  background: #fff !important;
}
.my-message {
  .v-input__slot {
    box-shadow: none !important;
  }
}
.theme--light .v-input:not(.v-input--is-disabled) textarea {
  color: #a1a1a1;
}
</style>
