package com.sh.local.army

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections

class LanAddressModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "LanAddress"

  @ReactMethod
  fun getAddresses(promise: Promise) {
    Thread {
      try {
        val result = Arguments.createArray()
        val interfaces = NetworkInterface.getNetworkInterfaces()

        if (interfaces != null) {
          for (network in Collections.list(interfaces)) {
            if (!network.isUp || network.isLoopback) {
              continue
            }

            for (address in Collections.list(network.inetAddresses)) {
              if (
                address !is Inet4Address ||
                address.isLoopbackAddress ||
                address.isAnyLocalAddress ||
                address.isLinkLocalAddress
              ) {
                continue
              }

              val ip = address.hostAddress ?: continue

              val item = Arguments.createMap()
              item.putString("address", ip)
              item.putString("interfaceName", network.name)
              item.putBoolean("isPrivate", address.isSiteLocalAddress)

              result.pushMap(item)
            }
          }
        }

        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject(
          "LAN_ADDRESS_ERROR",
          "خواندن آدرس‌های شبکه ناموفق بود.",
          error
        )
      }
    }.start()
  }
}
