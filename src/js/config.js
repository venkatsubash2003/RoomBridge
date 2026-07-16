/**
 * Runtime configuration for the dependency-free prototype.
 * Production secrets must never be placed in this file.
 */
window.ROOMBRIDGE_CONFIG = Object.freeze({
  appName: "RoomBridge",
  environment: "prototype",
  defaultLocale: "en-US",
  defaultCurrency: "USD",
  demoVerification: true,
  integrations: Object.freeze({
    authentication: false,
    emailDelivery: false,
    smsDelivery: false,
    maps: false,
    realtimeMessaging: false,
    videoCalling: false,
    secureStorage: false,
    payments: false
  })
});
