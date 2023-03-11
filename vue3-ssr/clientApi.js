import { createReactiveObject } from '@live-change/vue3-components'
import * as lcdao from '@live-change/dao'
import { reactiveMixin, reactivePrefetchMixin, ReactiveObservableList } from '@live-change/dao-vue3'
import SockJsConnection from '@live-change/dao-sockjs'
import Api from "./Api.js"

function clientApi(settings = {}) {
  let credentials = settings.credentials ?? (window.__DAO_CACHE__ ? window.__CREDENTIALS__ : undefined)
  if(settings.credentials) {
    credentials = { ...credentials, ...settings.credentials }
  }
  const dao = new lcdao.Dao(credentials, {
    remoteUrl: settings.remoteUrl || document.location.protocol + '//' + document.location.host + "/api/sockjs",
    protocols: {
      'sockjs': SockJsConnection
    },

    ...settings,

    connectionSettings: {
      fastAuth: !window.hasOwnProperty('__CREDENTIALS__'),

      queueRequestsWhenDisconnected: true,
      requestSendTimeout: Infinity,
      requestTimeout: Infinity,
      queueActiveRequestsOnDisconnect: true,
      autoReconnectDelay: 200,
      logLevel: 1,
      /*connectionMonitorFactory: (connection) =>
          new ReactiveDao.ConnectionMonitorPinger(connection, {
            pingInterval: 50,
            pongInterval: 200
          })*/

      ...(settings && settings.connectionSettings)
    },

    defaultRoute: {
      type: "remote",
      generator: ReactiveObservableList
    }
  })

  const api = new Api(dao)
  api.setup({
    ssr: (typeof window == "undefined") || !!window.__DAO_CACHE__,
    cache: true,
    ...settings,
    createReactiveObject(definition) {
      //console.log("CREATE REACTIVE OBJECT", definition)
      return createReactiveObject(definition, reactiveMixin(api), reactivePrefetchMixin(api) )
    }
  })
  for(const plugin of (settings.use || [])) {
    plugin(api)
  }
  if(!!window.__DAO_CACHE__) {
    api.generateServicesApi()
  }

  return api
}

export { clientApi }
