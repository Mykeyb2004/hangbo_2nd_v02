"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ReportScaffold } from "@/components/report-scaffold";

const PIN_LENGTH = 6;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

type ReportUnlockScreenProps = {
  periodLabel?: string;
};

function formatLockDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(value);
}

function formatLockTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

export function ReportUnlockScreen({ periodLabel: _periodLabel }: ReportUnlockScreenProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const dots = useMemo(
    () => Array.from({ length: PIN_LENGTH }, (_, index) => index < pin.length),
    [pin.length],
  );

  const resetPin = () => {
    setPin("");
    setIsSubmitting(false);
  };

  const submitPin = async (candidate: string) => {
    if (candidate.length !== PIN_LENGTH || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/report-unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: candidate }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? "解锁失败，请稍后重试。");
        setPin("");
        setIsSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setError("网络异常，请稍后重试。");
      setPin("");
      setIsSubmitting(false);
    }
  };

  const appendDigit = (digit: string) => {
    if (isSubmitting || pin.length >= PIN_LENGTH) {
      return;
    }

    const nextPin = `${pin}${digit}`.slice(0, PIN_LENGTH);
    setPin(nextPin);
    setError("");

    if (nextPin.length === PIN_LENGTH) {
      void submitPin(nextPin);
    }
  };

  const removeDigit = () => {
    if (isSubmitting || pin.length === 0) {
      return;
    }

    setPin((current) => current.slice(0, -1));
    setError("");
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSubmitting) {
        return;
      }

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        appendDigit(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        removeDigit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        resetPin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, pin]);

  return (
    <ReportScaffold>
      <section className="unlock-shell" aria-labelledby="report-unlock-title">
        <div className="unlock-layout unlock-layout--compact">
          <div className="unlock-device" role="group" aria-label="数字解锁面板">
            <div className="unlock-device-top">
              <span className="unlock-signal">REPORT ACCESS</span>
              <span className="unlock-badge">PIN · 6</span>
            </div>

            <div className="unlock-display">
              <p className="unlock-date">{formatLockDate(now)}</p>
              <p className="unlock-time" aria-live="polite">
                {formatLockTime(now)}
              </p>
              <p className="unlock-title">输入访问 PIN</p>
              <div className="unlock-dots" aria-label={`已输入 ${pin.length} 位`}>
                {dots.map((filled, index) => (
                  <span
                    className={filled ? "unlock-dot is-filled" : "unlock-dot"}
                    key={index}
                  />
                ))}
              </div>
              <p className="unlock-hint">
                支持键盘输入数字与退格。输入满 6 位后自动校验。
              </p>
            </div>

            <div className="unlock-keypad">
              {DIGITS.map((value, index) => {
                if (value === "") {
                  return <div className="unlock-key-spacer" key={`spacer-${index}`} aria-hidden="true" />;
                }

                const isDelete = value === "⌫";
                return (
                  <button
                    className={isDelete ? "unlock-key is-ghost" : "unlock-key"}
                    key={value}
                    onClick={() => {
                      if (isDelete) {
                        removeDigit();
                        return;
                      }

                      appendDigit(value);
                    }}
                    type="button"
                    disabled={isSubmitting}
                    aria-label={isDelete ? "删除一位" : `输入数字 ${value}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>

            <div className="unlock-status" aria-live="polite">
              {isSubmitting ? <span>正在校验访问 PIN...</span> : null}
              {!isSubmitting && error ? <span className="unlock-error">{error}</span> : null}
            </div>

            <div className="unlock-actions">
              <button
                className="unlock-action"
                type="button"
                onClick={resetPin}
                disabled={isSubmitting && pin.length === 0}
              >
                清空输入
              </button>
            </div>
          </div>
        </div>
      </section>
    </ReportScaffold>
  );
}
