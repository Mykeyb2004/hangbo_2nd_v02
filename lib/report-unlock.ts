import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const REPORT_UNLOCK_COOKIE_NAME = "report_unlock";
export const REPORT_UNLOCK_MAX_AGE = 60 * 60 * 12;

function getConfiguredPin() {
  return process.env.REPORT_UNLOCK_PIN?.trim() ?? "";
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signUnlockExpiry(expiresAt: string) {
  return createHmac("sha256", getConfiguredPin()).update(expiresAt).digest("base64url");
}

export function isReportUnlockEnabled() {
  return getConfiguredPin().length > 0;
}

export function verifyReportPin(pin: string) {
  const configuredPin = getConfiguredPin();
  const normalizedPin = pin.trim();

  if (!configuredPin || !/^\d+$/.test(normalizedPin)) {
    return false;
  }

  return safeCompare(normalizedPin, configuredPin);
}

export function createReportUnlockCookieValue(now = Date.now()) {
  const expiresAt = String(now + REPORT_UNLOCK_MAX_AGE * 1000);
  return `${expiresAt}.${signUnlockExpiry(expiresAt)}`;
}

export function isReportUnlockCookieValid(value?: string) {
  if (!isReportUnlockEnabled()) {
    return true;
  }

  if (!value) {
    return false;
  }

  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt)) {
    return false;
  }

  if (Number(expiresAt) <= Date.now()) {
    return false;
  }

  return safeCompare(signature, signUnlockExpiry(expiresAt));
}

export function getReportUnlockCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: REPORT_UNLOCK_MAX_AGE,
  };
}
