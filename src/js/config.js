/**
 * Non-secret browser defaults. Provider configuration remains server-side.
 * Production secrets must never be placed in this file.
 */
window.ROOMBRIDGE_CONFIG = Object.freeze({
  appName: "RoomBridge",
  environment: "server-managed",
  defaultLocale: "en-US",
  defaultCurrency: "USD",
  integrations: Object.freeze({
    authentication: true,
    emailDelivery: true,
    smsDelivery: true,
    maps: true,
    realtimeMessaging: true,
    videoCalling: false,
    secureStorage: true,
    payments: false
  })
});
