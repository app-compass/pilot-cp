// import _ from 'lodash'

const state = {
  visible: false,
  model: {},
  data: undefined,
  config: {
    type: undefined,
    css: undefined
  }
}

const getters = {
  data: state => state.data,
  visible: state => state.visible
}

const actions = {
  'modal.show' ({commit, state}, config) {
    if (config.cb) {
      state.config.cb = config.cb
    }
    state.config.type = config.type
    state.config.css = config.css
    state.visible = true
    state.data = config.data || null
    commit('visibility')
  },
  'modal.hide' ({commit, state}) {
    state.visible = false
    commit('visibility')
    return true
  },
  'modal.done' ({commit, state}, model) {
    state.visible = false
    state.model = model
    if (state.config.cb) {
      state.config.cb(state.model)
    }
    commit('visibility')
  }
}

const mutations = {
  visibility (state) {
    // do stuff if ya need
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
