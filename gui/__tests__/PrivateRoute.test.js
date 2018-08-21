/* eslint-env jest */
import React from 'react'
import configureStore from 'redux-mock-store'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { Route, Switch } from 'react-static'
import { MemoryRouter } from 'react-router'
import PrivateRoute from 'PrivateRoute'

const mockStore = configureStore()
const PrivatePage = () => (
  <div>Behind authentication</div>
)
const AuthenticatedApp = () => (
  <Switch>
    <PrivateRoute exact path='/' component={PrivatePage} />
  </Switch>
)
const mountAuthenticatedApp = (store) => (
  mount(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <Route component={AuthenticatedApp} />
      </MemoryRouter>
    </Provider>
  )
)

describe('PrivateRoute', () => {
  it('redirects when user is NOT autheticated', () => {
    const state = { authentication: { authenticated: false } }
    const wrapper = mountAuthenticatedApp(mockStore(state))
    expect(wrapper.find(AuthenticatedApp).props().location.pathname).toBe('/signin')
  })

  it('goes to destination when user is autheticated', async () => {
    const state = { authentication: { authenticated: true } }
    const wrapper = mountAuthenticatedApp(mockStore(state))
    expect(wrapper.find(AuthenticatedApp).props().location.pathname).toBe('/')
    expect(wrapper.text()).toContain('Behind authentication')
  })
})
