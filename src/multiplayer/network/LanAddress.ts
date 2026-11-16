import { NativeModules, Platform } from "react-native";

export type LanAddress = {
  address: string;
  interfaceName: string;
  isPrivate: boolean;
};

type LanAddressNativeModule = {
  getAddresses(): Promise<LanAddress[]>;
};

export async function getLanAddresses(): Promise<LanAddress[]> {
  if (Platform.OS !== "android") {
    throw new Error(
      "نمایش آدرس‌های شبکه فعلاً فقط برای Android پیاده‌سازی شده است.",
    );
  }

  const nativeModule = NativeModules.LanAddress as
    | LanAddressNativeModule
    | undefined;

  if (!nativeModule) {
    throw new Error(
      "ماژول LanAddress در دسترس نیست. برنامه را با run-android دوباره بیلد و نصب کن.",
    );
  }

  const addresses = await nativeModule.getAddresses();

  // آدرس‌های خصوصی ابتدا نمایش داده می‌شوند.
  // خصوصی‌بودن به‌تنهایی ثابت نمی‌کند آدرس متعلق به هات‌اسپات است.
  return [...addresses].sort(
    (a, b) =>
      Number(b.isPrivate) - Number(a.isPrivate) ||
      a.interfaceName.localeCompare(b.interfaceName) ||
      a.address.localeCompare(b.address),
  );
}
