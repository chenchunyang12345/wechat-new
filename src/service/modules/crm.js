import axios from 'axios'

export const loginCrm = params => {
    return axios.post('http://115.182.62.175:9999/user/login', params)
}

export const getCrmUserInfo = (id, params) => {
    return axios.post(`http://115.182.62.175:9999/apps/contacts/get/wx/contacts/${id}`, params)
}

export const updateCrmUserInfo = (id, params) => {
    return axios.post(`http://115.182.62.175:9999/apps/contacts/update/wx/contacts/${id}`, params)
}

export const addToDo = (id, params) => {
    return axios.post(`http://115.182.62.175:9999/apps/contacts/sava/todo/list/${id}`, params)
}

export const addCalendar = (id, params) => {
    return axios.post(`http://115.182.62.175:9999/apps/contacts/sava/calendar/${id}`, params)
}