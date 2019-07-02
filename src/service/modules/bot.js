import axios from 'axios'

export const turnOnRobot = params => {
    return axios.post('http://115.182.62.171:2782/sessions', params)
}

export const getRobotAnswer = (id, params) => {
    return axios.post(`http://115.182.62.171:2782/session/${id}`, params)
}