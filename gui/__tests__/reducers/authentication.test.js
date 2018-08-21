import reducer from 'connectors/redux/reducers'
import { get as getAuthenticationStorage } from 'utils/authenticationStorage'
import {
  REQUEST_SIGNIN,
  RECEIVE_SIGNIN_SUCCESS,
  RECEIVE_SIGNIN_FAIL,
  RECEIVE_SIGNIN_ERROR,
  REQUEST_SIGNOUT,
  RECEIVE_SIGNOUT_SUCCESS,
  RECEIVE_SIGNOUT_ERROR
} from 'actions'

describe('authentication reducer', () => {
  beforeEach(() => {
    global.localStorage.clear()
  })

  it('should return the initial state', () => {
    const state = reducer(undefined, {})

    expect(state.authentication).toEqual({
      fetching: false,
      authenticated: false,
      errors: [],
      networkError: false
    })
  })

  it('REQUEST_SIGNIN starts fetching and disables the network error', () => {
    const action = {type: REQUEST_SIGNIN}
    const state = reducer(undefined, action)

    expect(state.authentication.fetching).toEqual(true)
    expect(state.authentication.networkError).toEqual(false)
  })

  describe('RECEIVE_SIGNIN_SUCCESS', () => {
    it('stops fetching and assigns authenticated', () => {
      const previousState = {
        authentication: {
          fetching: true,
          networkError: true
        }
      }
      const action = {type: RECEIVE_SIGNIN_SUCCESS, authenticated: true}
      const state = reducer(previousState, action)

      expect(state.authentication.authenticated).toEqual(true)
      expect(state.authentication.fetching).toEqual(false)
      expect(state.authentication.networkError).toEqual(false)
    })

    it('saves authenticated to local storage', () => {
      const action = {type: RECEIVE_SIGNIN_SUCCESS, authenticated: true}
      reducer(undefined, action)

      expect(getAuthenticationStorage()).toEqual({authenticated: true})
    })
  })

  describe('RECEIVE_SIGNIN_FAIL', () => {
    it('stops fetching and clears authentication errors', () => {
      const previousState = {
        authentication: {
          authenticated: true,
          fetching: true,
          errors: ['error 1']
        }
      }
      const action = {type: RECEIVE_SIGNIN_FAIL}
      const state = reducer(previousState, action)

      expect(state.authentication.authenticated).toEqual(false)
      expect(state.authentication.fetching).toEqual(false)
      expect(state.authentication.errors).toEqual([])
    })

    it('saves authenticated false to local storage', () => {
      const action = {type: RECEIVE_SIGNIN_FAIL}
      reducer(undefined, action)

      expect(getAuthenticationStorage()).toEqual({authenticated: false})
    })
  })

  describe('RECEIVE_SIGNIN_ERROR', () => {
    it('stops fetching and assigns a network error', () => {
      const previousState = {
        authentication: {
          authenticated: true,
          fetching: true,
          networkError: false
        }
      }
      const action = {type: RECEIVE_SIGNIN_ERROR, networkError: true}
      const state = reducer(previousState, action)

      expect(state.authentication.fetching).toEqual(false)
      expect(state.authentication.networkError).toEqual(true)
      expect(state.authentication.authenticated).toEqual(false)
    })

    it('saves authenticated false to local storage', () => {
      const action = {type: RECEIVE_SIGNIN_ERROR}
      reducer(undefined, action)

      expect(getAuthenticationStorage()).toEqual({authenticated: false})
    })
  })

  it('REQUEST_SIGNOUT starts fetching and disables the network error', () => {
    const action = {type: REQUEST_SIGNOUT}
    const state = reducer(undefined, action)

    expect(state.authentication.fetching).toEqual(true)
    expect(state.authentication.networkError).toEqual(false)
  })

  describe('RECEIVE_SIGNOUT_SUCCESS', () => {
    it('stops fetching and assigns authenticated', () => {
      const previousState = {
        authentication: {
          authenticated: true,
          fetching: true,
          networkError: true
        }
      }
      const action = {type: RECEIVE_SIGNOUT_SUCCESS, authenticated: false}
      const state = reducer(previousState, action)

      expect(state.authentication.authenticated).toEqual(false)
      expect(state.authentication.fetching).toEqual(false)
      expect(state.authentication.networkError).toEqual(false)
    })

    it('saves authenticated to local storage', () => {
      const action = {type: RECEIVE_SIGNOUT_SUCCESS, authenticated: false}
      reducer(undefined, action)

      expect(getAuthenticationStorage()).toEqual({authenticated: false})
    })
  })

  describe('RECEIVE_SIGNOUT_ERROR', () => {
    it('stops fetching and assigns a network error', () => {
      const previousState = {
        authentication: {
          authenticated: true,
          fetching: true,
          networkError: false
        }
      }
      const action = {type: RECEIVE_SIGNOUT_ERROR, networkError: true}
      const state = reducer(previousState, action)

      expect(state.authentication.fetching).toEqual(false)
      expect(state.authentication.networkError).toEqual(true)
      expect(state.authentication.authenticated).toEqual(false)
    })

    it('saves authenticated false to local storage', () => {
      const action = {type: RECEIVE_SIGNOUT_ERROR}
      reducer(undefined, action)

      expect(getAuthenticationStorage()).toEqual({authenticated: false})
    })
  })
})
