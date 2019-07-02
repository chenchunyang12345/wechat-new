<template>
    <div class="info-right-wrap">
        <div class="right-top" ref="container">
            <!-- 图 -->
            <div v-show="false">{{activeUser}}</div>
        </div>
        <div class="right-bottom">
            <h2>关键信息提取（日程,提示信息）</h2>
            <h3>待办事项</h3>
            <ul v-for="(item, idx) in rightBottomInfo_todo" :key="idx">
                <li>{{item}}</li>
            </ul>
            <h3 class="paddingTop">新的日程</h3>
            <ul>
                {{rightBottomInfo_date['时间'] ? '时间:' + rightBottomInfo_date['时间'] : null}}
                <br/>
                {{rightBottomInfo_date['地点'] ? '地点:' + rightBottomInfo_date['地点'] : null}}
            </ul>
        </div>
    </div>
</template>

<script>
let container, option;
import {mapGetters, mapActions} from 'vuex'
import { Network, DataSet, DataView } from 'vis/index-network';
export default {
    computed: {
        ...mapGetters(['rightBottomInfo_todo', 'rightBottomInfo_date', 'visNodes', 'visEdges', 'activeUser', 'updateIndex']),
    },
    mounted() {
        // 容器
        container = this.$refs.container;
        // vis相关设置
        option = {
            nodes: {
                shape: 'circle',
                widthConstraint: {
                    minimum: 50,
                },
                chosen: false
            },
            edges: {
                arrows: 'to',
            },
        };
    },
    methods: {
        createNewVis(name) {
            if(this.visNodes[name] === undefined) {
            // if(JSON.stringify(this.visNodes[name]) === JSON.stringify({})) {
                let nodes = new DataSet();
                this.$store.commit('SET_VISNODES', {nodes, name})
                let edges = new DataSet();
                this.$store.commit('SET_VISEDGES', {edges, name})
                let data = {
                    nodes,
                    edges,
                }
                new Network(container, data, option);
            } else {
                let nodes = this.visNodes[name];
                let edges = this.visEdges[name];
                let data = {
                    nodes,
                    edges,
                }
                new Network(container, data, option);
            }
            this.$store.commit('SET_UPDATEINDEX', 1);
        },
        upDateVis(name) {
            console.log(1)
        }
    },
    updated() {
        let name = this.activeUser.NickName;
        if(this.updateIndex === 1) {
            this.upDateVis(name)
        } else if (this.updateIndex === 2) {
            this.createNewVis(name);
        }
    }
}
</script>

<style lang="scss" scoped>
.info-right-wrap {
    width: 100%;
    background-color: #fff;
    display: flex;
    flex-direction: column;

    .right-top {
        width: 100%;
        height: 50%;
        border: 2px solid #ccc;
        border-bottom: none;
        background-color: rgba(99,135,255,0.1);
    }

    .right-bottom {
        width: 100%;
        height: 50%;
        border: 2px solid #ccc;
        background-color: rgba(128,207,212,0.1);

        ul {
            padding-left: 40px;
            font-size: 18px;
            line-height: 50px;
            color: #666;

            li {
                height: 30px;
            }
        }

        h3 {
            font-size: 18px;
            color: #333;
            padding-left: 20px;
            font-weight: normal;
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
.paddingTop {
    padding-top: 30px;
}
</style>
