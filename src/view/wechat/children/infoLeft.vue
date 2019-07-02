<template>
    <div class="info-left-wrap">
        <div class="left-top">
            <h2>用户信息挖掘</h2>
            <ul v-for="(item, idx) in leftTopInfo" :key="idx">
                <li>{{item}}</li>
            </ul>
        </div>
        <div class="left-bottom">
            <h2>专业知识辅助（产品搜索.展示）</h2>
            <div style="overflow: auto; height: 350px">
                <div class="wrap" v-for="(item, idx) in leftBottomInfo" :key="idx">
                    <div class="index">{{idx + 1}}、</div>
                    <ul>
                        <li>{{item.name}}</li>
                        <li>险种类型：{{item.type}}</li>
                        <li>产品特点：{{item.characteristics}}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'
export default {
    computed: {
        ...mapGetters(['leftTopInfo', 'leftBottomInfo']),
    }
}
</script>

<style lang="scss" scoped>
.info-left-wrap {
    width: 100%;
    background-color: #fff;
    display: flex;
    flex-direction: column;

    .left-top {
        width: 100%;
        height: 50%;
        border: 2px solid #ccc;
        border-bottom: none;
        background-color: rgba(235,225,47,0.1);

        ul {
            padding-left: 35px;
            font-size: 18px;
            line-height: 50px;
            color: #666;

            li {
                height: 30px;     
            }
        }
    }

    .left-bottom {
        width: 100%;
        height: 50%;
        border: 2px solid #ccc;
        background-color: rgba(255,147,144,0.1);

        .wrap {
            display: flex;
            padding-left: 12px;
            font-size: 18px;
            line-height: 50px;
            color: #666;

            .index {
                line-height: 28px;
            }

            li {
                line-height: 30px;
                list-style: none;
                margin-bottom: 5px;
            }
        }
    }
}
h2 {
    font-size: 20px;
    line-height: 50px;
    height: 50px;
    padding-top: 20px;
    padding-left: 20px;
    margin-bottom: 30px;
    color: #5584ff;
}
ul,li {
    list-style: disc;
}
</style>
