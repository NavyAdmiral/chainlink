import build from 'redux-object'

export default (state, id) =>
  build(state.earnings, 'items', id, { eager: true })
