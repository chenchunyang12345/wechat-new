<template>
  <div class="chat-session-body-header">
    <v-toolbar dark color="grey lighten-4" height="56">
      <v-toolbar-title class="black--text">
        <span v-html="activeUser.RemarkName?activeUser.RemarkName:activeUser.NickName"></span>
      </v-toolbar-title>
    </v-toolbar>
  </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'
export default {
  components: {
  },
  data: () => ({
    userCardShow: false
  }),
  computed: {
    ...mapGetters(['activeUser'])
  },
  methods: {
    ...mapActions(['getWxUserInfo', 'updateWxUserMember']),
    async getWxLoginUserInfo () {
      await this.getWxUserInfo()
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-session-body {
  &-header {
    position: relative;
    border-bottom: 1px solid #ccc;
    border-top: 1px solid #ccc;
  }
  &-bd {
    position: relative;
    height: 478px;
    width: 100%;
    padding: 20px 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  &-ft {
    height: 118px;
    border-top: 1px solid #ccc;
    position: relative;
  }
}
// 重置vuetify样式
.v-btn--floating.v-btn--small {
  height: 35px;
  width: 35px;
}
.v-toolbar {
  box-shadow: none;
}
</style>
