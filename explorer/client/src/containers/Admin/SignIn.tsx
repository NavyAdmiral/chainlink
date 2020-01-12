import React from 'react'
import { connect, MapDispatchToProps, MapStateToProps } from 'react-redux'
import { Redirect, RouteComponentProps } from '@reach/router'
import { SignInForm } from '@chainlink/styleguide'
import { signIn } from '../../actions/adminAuth'
import { AppState } from '../../reducers'
import { DispatchBinding } from '../../utils/types'

interface OwnProps {}

interface StateProps {
  authenticated: boolean
  errors: string[]
}

interface DispatchProps {
  signIn: DispatchBinding<typeof signIn>
}

interface Props
  extends RouteComponentProps,
    StateProps,
    DispatchProps,
    OwnProps {}

export const SignIn: React.FC<Props> = ({ authenticated, errors, signIn }) => {
  return authenticated ? (
    <Redirect to="/admin" noThrow />
  ) : (
    <SignInForm
      title="Explorer Admin"
      onSubmitExplorer={signIn}
      errors={errors}
    />
  )
}

const mapStateToProps: MapStateToProps<
  StateProps,
  OwnProps,
  AppState
> = state => {
  return {
    authenticated: state.adminAuth.allowed,
    errors: state.notifications.errors,
  }
}

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = {
  signIn,
}

export const ConnectedSignIn = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SignIn)

export default ConnectedSignIn
