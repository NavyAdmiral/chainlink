import React, { Component } from 'react'
import { SheetsRegistry } from 'react-jss/lib/jss'
import JssProvider from 'react-jss/lib/JssProvider'
import { MuiThemeProvider, createMuiTheme, createGenerateClassName } from '@material-ui/core/styles'
import theme from './src/theme' // Custom Material UI theme
import extractBuildInfo from './src/utils/extractBuildInfo'

const buildInfo = extractBuildInfo()

export default {
  getSiteData: () => ({
    title: 'Chainlink'
  }),
  getRoutes: async () => {
    return [
      {path: '/'},
      {path: '/jobs'},
      {path: '/jobs/page/_jobPage_'},
      {path: '/jobs/new'},
      {path: '/job_specs/_jobSpecId_'},
      {path: '/job_specs/_jobSpecId_/runs'},
      {path: '/job_specs/_jobSpecId_/runs/page/_jobRunsPage_'},
      {path: '/job_specs/_jobSpecId_/runs/id/_jobRunId_'},
      {path: '/bridges'},
      {path: '/bridges/page/_bridgePage_'},
      {path: '/bridges/new'},
      {path: '/bridges/_bridgeId_'},
      {path: '/bridges/_bridgeId_/edit'},
      {path: '/config'},
      {path: '/signin'},
      {path: '/signout'},
      {
        path: '/about',
        component: 'src/containers/About',
        getData: () => buildInfo
      },
      {is404: true, component: 'src/containers/404'}
    ]
  },
  renderToHtml: (render, Comp, meta) => {
    const sheetsRegistry = new SheetsRegistry()
    const muiTheme = createMuiTheme(theme)

    const generateClassName = createGenerateClassName()

    const html = render(
      <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
        <MuiThemeProvider theme={muiTheme} sheetsManager={new Map()}>
          <Comp />
        </MuiThemeProvider>
      </JssProvider>
    )

    meta.jssStyles = sheetsRegistry.toString()

    return html
  },
  Document: class CustomHtml extends Component {
    render () {
      const {
        Html, Head, Body, children, renderMeta
      } = this.props

      return (
        <Html>
          <Head>
            <meta charSet='UTF-8' />
            <meta name='viewport' content='width=device-width, initial-scale=1' />
            <link
              href='https://fonts.googleapis.com/css?family=Roboto:300,400,500'
              rel='stylesheet'
            />
            <link
              rel='shortcut icon'
              type='image/x-icon'
              href='/favicon.ico'
            />
          </Head>
          <Body>
            {children}
            <style id='jss-server-side'>{renderMeta.jssStyles}</style>
          </Body>
        </Html>
      )
    }
  }
}
