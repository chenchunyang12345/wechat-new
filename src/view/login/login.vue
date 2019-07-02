<template>
  <div class='box'>
    <div class="wrap">
      <div class="line">
        <div class="item">用户:</div>
        <el-input v-model="username"></el-input>
      </div>
      <div class="line last">
        <div class="item">密码:</div>
        <el-input v-model="password" show-password></el-input>
      </div>
      <div class="btns">
        <el-button type="primary" v-on:click="login">登录</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { loginCrm } from '@/service/modules/crm'
export default {
  data: () => ({
    username: '',
    password: '',
  }),
  computed: {

  },
  methods: {
    login() {
      let params = {
        username: this.username,
        password: this.password,
      }
      loginCrm(params).then((data) => {
        if(data) {
          this.$store.commit('SET_CRMUSERID', data)
          this.$router.push({path:'/wechat'})
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.box {
  width: 100%;
  height: 100vh;
  font-size: 14px;

  .wrap {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background-color: #fff;
    border-radius: 5px;

    .line {
      display: flex;
      align-items: center;
      padding-top: 50px;
      padding-left: 20px;
      padding-right: 30px;

      .item {
        flex-basis: 50px;
      }
    }

    .last {
      padding-bottom: 30px;
    }

    .btns {
      padding-bottom: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
