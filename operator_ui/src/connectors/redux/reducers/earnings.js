const initialState = {
  items: {}
}

export const UPSERT_JOB_EARNING = 'UPSERT_JOB_EARNING'

export default (state = initialState, action = {}) => {
  switch (action.type) {
    case UPSERT_JOB_EARNING: {
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, action.data.linkEarnedWeeklies)
      })
    }
    default:
      return state
  }
}
